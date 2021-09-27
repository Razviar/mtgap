using SharpMonoInjector;
using System;
using System.Diagnostics;
using System.IO;
using System.Reflection;
using System.Runtime.InteropServices;
using System.Text;
using System.Threading;
using System.Web.Script.Serialization;
using System.Windows.Forms;

namespace getFrontWindow
{
    class Program
    {
        [DllImport("user32.dll", CharSet = CharSet.Auto, ExactSpelling = true)]
        static extern IntPtr GetForegroundWindow();
        [DllImport("user32.dll", SetLastError = true)]
        static extern uint GetWindowThreadProcessId(IntPtr hWnd, out uint lpdwProcessId);
        [DllImport("user32.dll", CharSet = CharSet.Auto, SetLastError = true)]
        static extern int GetWindowText(IntPtr hWnd, StringBuilder lpString, int nMaxCount);
        [DllImport("user32.dll", SetLastError = true, CharSet = CharSet.Auto)]
        static extern int GetWindowTextLength(IntPtr hWnd);
        [DllImport("user32.dll", SetLastError = true)]
        static extern bool GetWindowRect(IntPtr hwnd, out RECT lpRect);
        [DllImport("user32.dll")]
        private static extern IntPtr SetWinEventHook(uint eventMin, uint eventMax, IntPtr hmodWinEventProc, WinEventDelegate lpfnWinEventProc, uint idProcess, uint idThread, uint dwFlags);

        [DllImport("user32.dll", SetLastError = false)]
        internal static extern bool UnhookWinEvent(IntPtr hWinEventHook);

        [DllImport("advapi32.dll", SetLastError = true)]
        private static extern bool OpenProcessToken(IntPtr ProcessHandle, uint DesiredAccess, out IntPtr TokenHandle);
        [DllImport("kernel32.dll", SetLastError = true)]
        [return: MarshalAs(UnmanagedType.Bool)]
        private static extern bool CloseHandle(IntPtr hObject);

        public delegate void WinEventDelegate(IntPtr hWinEventHook, uint eventType, IntPtr hwnd, int idObject, int idChild, uint dwEventThread, uint dwmsEventTime);

        [StructLayout(LayoutKind.Sequential)]
        public struct RECT
        {
            public int left;        // x position of upper-left corner
            public int top;         // y position of upper-left corner
            public int right;       // x position of lower-right corner
            public int bottom;      // y position of lower-right corner
        }

        public struct Bounds
        {
            public int x;
            public int y;
            public int width;
            public int height;
        }

        public static Bounds currentBounds = new Bounds { x = 0, y = 0, width = 0, height = 0 };

        public struct Owner
        {
            public uint processId;
        }

        public struct ForegroundWindowOutput
        {
            public string platform;
            public int id;
            public string title;
            public Owner owner;
            public Bounds bounds;
            public bool admin;
        }

        private const uint EVENT_OBJECT_LOCATIONCHANGE = 0x800B;
        private const uint WINEVENT_OUTOFCONTEXT = 0x0000;
        private const uint WINEVENT_SKIPOWNPROCESS = 0x0002;
        private const uint WINEVENT_SKIPOWNTHREAD = 0x0001;
        private const uint EVENT_SYSTEM_FOREGROUND = 0x0003;
        private const uint EVENT_SYSTEM_MINIMIZESTART = 0x0016;

        private static uint MTGAprocessID = 0;
        private static IntPtr activeWindowHandle;
        private static IntPtr injectedAssembly = IntPtr.Zero;
        private static bool hookSet = false;
        private static bool InjectionDone = false;
        private static bool DontDoInjection = false;
        private static bool JustDoInjection = false;
        private static WinEventDelegate deleTargetMoved = null;
        private static WinEventDelegate deleForegroundChanged = null;
        private static IntPtr[] hook=new IntPtr[3];
        private static ForegroundWindowOutput output;

        public static string AssemblyDirectory
        {
            get
            {
                string codeBase = Assembly.GetExecutingAssembly().CodeBase;
                UriBuilder uri = new UriBuilder(codeBase);
                string path = Uri.UnescapeDataString(uri.Path);
                return Path.GetDirectoryName(path);
            }
        }

        private static bool GetProcessUser(uint ProcessID)
        {
            try
            {
                Process process = Process.GetProcessById(Convert.ToInt32(ProcessID));
                IntPtr TokenHandle = IntPtr.Zero;
                OpenProcessToken(process.Handle, 0x0008, out TokenHandle);
                return false;
            }
            catch (Exception)
            {
                return true;
            }
        }

        static void TargetMoved(IntPtr hWinEventHook, uint eventType, IntPtr lParam, int idObject, int idChild, uint dwEventThread, uint dwmsEventTime)
        {
            GetWindowRect(activeWindowHandle, out RECT rct);
            Bounds result = new Bounds { x = rct.left < 0 ? 0 : rct.left, y = rct.top < 0 ? 0 : rct.top, width = rct.right - (rct.left < 0 ? 0 : rct.left), height = rct.bottom - (rct.top < 0 ? 0 : rct.top) };
            if(currentBounds.x != result.x || currentBounds.y != result.y || currentBounds.height != result.height || currentBounds.width != result.width)
            {
                output.bounds = result;
                string json = new JavaScriptSerializer().Serialize(output);
                currentBounds.x = result.x;
                currentBounds.y = result.y;
                currentBounds.height = result.height;
                currentBounds.width = result.width;
                Console.WriteLine(json);
            }    
        }

        static void ForegroundChanged(IntPtr hWinEventHook, uint eventType, IntPtr lParam, int idObject, int idChild, uint dwEventThread, uint dwmsEventTime)
        {
            output.title = "NotWhatYouWant";
            output.owner.processId = 0;
            string json = new JavaScriptSerializer().Serialize(output);
            Console.WriteLine(json);
            UnhookWinEvent(hook[0]);
            UnhookWinEvent(hook[1]);
            UnhookWinEvent(hook[2]);
            hookSet = false;
            LocateAndHook();
        }

        private static bool Inject(string assemblyPath, string nmspc, string className, string methodName)
        {
            byte[] assembly;
            Injector injector = new Injector((int)MTGAprocessID);
            try
            {
                assembly = File.ReadAllBytes(assemblyPath);
            }
            catch(Exception e)
            {
                Console.WriteLine(e.ToString());
                return false;
            }

            using (injector)
            {
                try
                {
                    injectedAssembly = injector.Inject(assembly, nmspc, className, methodName);
                }
                catch (InjectorException e)
                {
                    Console.WriteLine(e.ToString());
                    return false;
                }
                catch (Exception e)
                {
                    Console.WriteLine(e.ToString());
                    return false;
                }

                if (injectedAssembly == IntPtr.Zero)
                {
                    return false;
                }
                else
                {
                    return true;
                }

            }
        }

        static void LocateAndHook()
        {
            try
            {
                while (!hookSet)
                {
                    activeWindowHandle = GetForegroundWindow();
                    uint threadID = GetWindowThreadProcessId(activeWindowHandle, out uint newPID);
                    int length = GetWindowTextLength(activeWindowHandle);
                    StringBuilder sb = new StringBuilder(length + 1);
                    GetWindowText(activeWindowHandle, sb, sb.Capacity);
                    string title = sb.ToString();
                    Process MTGAProcess = Process.GetProcessById((int)newPID);
                    if (title == @"MTGA" && MTGAProcess.MainModule.ModuleName == "MTGA.exe")
                    {
                        if(newPID != MTGAprocessID)
                        {
                            MTGAprocessID = newPID;
                            InjectionDone = false;
                        }
                        if (!InjectionDone && !DontDoInjection)
                        {
                            Thread.Sleep(3000);
                            InjectionDone = Inject($"{AssemblyDirectory}\\GetData2.dll", "GetData2", "Loader", "Load");
                            if (!InjectionDone)
                            {
                                DontDoInjection = true;
                            }
                            
                            if (JustDoInjection)
                            {
                                Environment.Exit(0);
                            }
                        }

                        GetWindowRect(activeWindowHandle, out RECT rct);
                        Bounds result = new Bounds { x = rct.left < 0 ? 0 : rct.left, y = rct.top < 0 ? 0 : rct.top, width = rct.right - (rct.left < 0 ? 0 : rct.left), height = rct.bottom - (rct.top < 0 ? 0 : rct.top) };

                        output = new ForegroundWindowOutput { platform = "windows", id = (int)activeWindowHandle, owner = { processId = MTGAprocessID }, bounds = result, title = title, admin = GetProcessUser(MTGAprocessID) };

                        string json = new JavaScriptSerializer().Serialize(output);

                        Console.WriteLine(json);
                        deleTargetMoved = new WinEventDelegate(TargetMoved);
                        deleForegroundChanged = new WinEventDelegate(ForegroundChanged);
                        hook[0] = SetWinEventHook(EVENT_OBJECT_LOCATIONCHANGE, EVENT_OBJECT_LOCATIONCHANGE, IntPtr.Zero, deleTargetMoved, MTGAprocessID, threadID, WINEVENT_OUTOFCONTEXT | WINEVENT_SKIPOWNPROCESS | WINEVENT_SKIPOWNTHREAD);
                        hook[1] = SetWinEventHook(EVENT_SYSTEM_FOREGROUND, EVENT_SYSTEM_FOREGROUND, IntPtr.Zero, deleForegroundChanged, 0, 0, WINEVENT_OUTOFCONTEXT | WINEVENT_SKIPOWNPROCESS | WINEVENT_SKIPOWNTHREAD);
                        hook[2] = SetWinEventHook(EVENT_SYSTEM_MINIMIZESTART, EVENT_SYSTEM_MINIMIZESTART, IntPtr.Zero, deleForegroundChanged, MTGAprocessID, threadID, WINEVENT_OUTOFCONTEXT | WINEVENT_SKIPOWNPROCESS | WINEVENT_SKIPOWNTHREAD);
                        hookSet = true;
                    }
                    Thread.Sleep(500);
                }
            }
            catch (Exception e)
            {
                Console.WriteLine(e.ToString());
                ForegroundWindowOutput output = new ForegroundWindowOutput { platform = "windows", id = 0, owner = { processId = 0 }, bounds = { x = 0, y = 0, width = 0, height = 0 } };
                string json = new JavaScriptSerializer().Serialize(output);
                Console.WriteLine(json);
            }
        }

        [STAThread]
        static void Main(string[] args)
        {
            if (args.Length > 0 && args[0] == "DontDoInjection")
            {
                DontDoInjection = true;
            }

            if (args.Length > 0 && args[0] == "JustDoInjection")
            {
                JustDoInjection = true;
            }

            LocateAndHook();
            Application.ApplicationExit += new EventHandler(Application_ApplicationExit);
            AppDomain.CurrentDomain.ProcessExit += new EventHandler(Application_ApplicationExit);
            Application.Run();
        }

        static void Application_ApplicationExit(object sender, EventArgs e)
        {
            UnhookWinEvent(hook[0]);
            UnhookWinEvent(hook[1]);
            UnhookWinEvent(hook[2]);
        }
    }
}
