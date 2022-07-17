using Newtonsoft.Json;
using System;
using System.Collections.Generic;
using System.Text;
using System.Threading;
using System.Threading.Tasks;
using UnityEngine;
using Wizards.Mtga.FrontDoorModels;

namespace GetData2
{
    public class LogElement
    {
        public string timestamp;
        public object Payload;
    }

    public class EntryFeeForLog
    {
        public string CurrencyType;
        public int Quantity;
    }

    public class ChestForLog
    {
        public string headerLocKey;
        public string descriptionLocKey;
        public Dictionary<string, int> locParams;
        public int Wins;
    }

    public class EventForLog
    {
        public string InternalEventName;
        public string PublicEventName;
        public string TitleLocKey;
        public DateTime StartTime;
        public DateTime LockedTime;
        public DateTime ClosedTime;
        public bool IsRanked;
        public List<EntryFeeForLog> EntryFees;
        public string DeckSelectFormat;
        public int MaxWins;
        public int MaxLoss;
        public bool isLimited;
        public string DescriptionText;
        public List<ChestForLog> Chests;
    }
    public class MTGAProGetData : MonoBehaviour
    {
        private static bool gotInventoryData = false;
        private static bool gotEventsData = false;
        private static bool gotLoginData = false;
        private static bool gotRankInfo = false;
        private static bool gotUniqueID = false;
        private static List<string> dataWrittenHashes = new List<string>();
        private static readonly UnityCrossThreadLogger MTGAProLogger = new UnityCrossThreadLogger("MTGA.Pro Logger");
        public void Start()
        {
            try
            {
                System.Random RNG = new System.Random();
                int length = 32;
                string rString = "";
                for (var i = 0; i < length; i++)
                {
                    rString += ((char)(RNG.Next(1, 26) + 64)).ToString().ToLower();
                }
                MTGAProLogger.Debug($" Unique Log Identifier: {rString}");
                Task task = new Task(() => GetHoldOnPapa());
                task.Start();
            }
            catch (Exception e)
            {
                WriteToLog("Error", e);
            }

        }

        public static string CreateMD5(string input)
        {
            // Use input string to calculate MD5 hash
            using (System.Security.Cryptography.MD5 md5 = System.Security.Cryptography.MD5.Create())
            {
                byte[] inputBytes = Encoding.ASCII.GetBytes(input);
                byte[] hashBytes = md5.ComputeHash(inputBytes);

                // Convert the byte array to hexadecimal string
                StringBuilder sb = new StringBuilder();
                for (int i = 0; i < hashBytes.Length; i++)
                {
                    sb.Append(hashBytes[i].ToString("X2"));
                }
                return sb.ToString();
            }
        }


        private void GetHoldOnPapa()
        {
            try
            {
                Thread.Sleep(10000);

                if (!gotLoginData && WrapperController.Instance != null && WrapperController.Instance.AccountClient != null && WrapperController.Instance.AccountClient.AccountInformation != null && WrapperController.Instance.AccountClient.AccountInformation.AccountID != null)
                {
                    PrintAccountInfo();
                }

                if (!gotInventoryData && WrapperController.Instance != null && WrapperController.Instance.InventoryManager != null && WrapperController.Instance.InventoryManager.Cards != null && WrapperController.Instance.InventoryManager.Cards.Count > 0)
                {
                    GetInventoryData();
                }

                if (!gotEventsData && WrapperController.Instance != null && WrapperController.Instance.EventManager != null && WrapperController.Instance.EventManager.EventsByInternalName != null && WrapperController.Instance.EventManager.EventsByInternalName.Count > 0)
                {
                    GetEventsData();
                }

                if (gotUniqueID && gotInventoryData && gotLoginData && gotRankInfo && gotEventsData)
                {
                    return;
                }
                else
                {
                    GetHoldOnPapa();
                }

            }
            catch (Exception e)
            {
                WriteToLog("ErrorGetHoldOnPapa", e);
            }
        }

        private void WriteToLog(string indicator, object report)
        {
            try
            {
                LogElement logElem = new LogElement
                {
                    Payload = report,
                    timestamp = new DateTimeOffset(DateTime.UtcNow).ToUnixTimeSeconds().ToString()
                };
                string hashMD5 = CreateMD5(JsonConvert.SerializeObject(report));
                if (!dataWrittenHashes.Contains(hashMD5) || indicator == @"LoginStateChanged")
                {
                    MTGAProLogger.Debug($" **{indicator}** {JsonConvert.SerializeObject(logElem)}");
                    dataWrittenHashes.Add(hashMD5);
                }
            }
            catch (Exception e)
            {
                MTGAProLogger.Debug($" **WriteToLogError** {e}");
            }
        }

        private void PrintAccountInfo()
        {
            try
            {
                WriteToLog("Userdata", new { userId = WrapperController.Instance.AccountClient.AccountInformation.AccountID, screenName = WrapperController.Instance.AccountClient.AccountInformation.DisplayName });
                WrapperController.Instance.AccountClient.LoginStateChanged += AccountClient_LoginStateChanged;
                gotLoginData = true;
            }
            catch (Exception e)
            {
                WriteToLog("ErrorPrintAccountInfo", e);
            }
        }

        private void GetEventsData()
        {
            try
            {
                gotEventsData = true;
                Dictionary<string, Wizards.MDN.EventContext> gameEvents = WrapperController.Instance.EventManager.EventsByInternalName;
                Dictionary<string, EventForLog> gameEventsOutput = new Dictionary<string, EventForLog>();
                foreach (KeyValuePair<string, Wizards.MDN.EventContext> gameEvent in gameEvents)
                {
                    List<EntryFeeForLog> EntryFeeList = new List<EntryFeeForLog>();
                    List<ChestForLog> ChestsList = new List<ChestForLog>();

                    foreach (Wotc.Mtga.Events.EventEntryFeeInfo entryFee in gameEvent.Value.PlayerEvent.EventInfo.EntryFees)
                    {
                        EntryFeeList.Add(new EntryFeeForLog { CurrencyType = entryFee.CurrencyType.ToString(), Quantity = entryFee.Quantity });
                    }

                    if (gameEvent.Value.PlayerEvent.EventUXInfo.EventComponentData.ByCourseObjectiveTrack != null)
                    {
                        foreach (var chest in gameEvent.Value.PlayerEvent.EventUXInfo.EventComponentData.ByCourseObjectiveTrack.ChestDescriptions)
                        {
                            ChestsList.Add(new ChestForLog { headerLocKey = chest.ChestDescription.headerLocKey, descriptionLocKey = chest.ChestDescription.descriptionLocKey, locParams = chest.ChestDescription.locParams, Wins = (int)chest.Wins });
                        }
                    }

                    gameEventsOutput.Add(gameEvent.Key, new EventForLog
                    {
                        InternalEventName = gameEvent.Value.PlayerEvent.EventInfo.InternalEventName,
                        PublicEventName = gameEvent.Value.PlayerEvent.EventUXInfo.PublicEventName,
                        TitleLocKey = gameEvent.Value.PlayerEvent.EventUXInfo.TitleLocKey,
                        StartTime = gameEvent.Value.PlayerEvent.EventInfo.StartTime,
                        LockedTime = gameEvent.Value.PlayerEvent.EventInfo.LockedTime,
                        ClosedTime = gameEvent.Value.PlayerEvent.EventInfo.ClosedTime,
                        IsRanked = gameEvent.Value.PlayerEvent.EventInfo.IsRanked,
                        EntryFees = EntryFeeList,
                        DeckSelectFormat = gameEvent.Value.PlayerEvent.EventUXInfo.DeckSelectFormat,
                        MaxWins = gameEvent.Value.PlayerEvent.EventUXInfo.EventComponentData.ByCourseObjectiveTrack != null ? gameEvent.Value.PlayerEvent.EventUXInfo.EventComponentData.ByCourseObjectiveTrack.ChestDescriptions.Count : 0,
                        MaxLoss = gameEvent.Value.PlayerEvent.EventUXInfo.EventComponentData.LossDetailsDisplay != null ? gameEvent.Value.PlayerEvent.EventUXInfo.EventComponentData.LossDetailsDisplay.Games : 0,
                        isLimited = gameEvent.Value.PlayerEvent.DefaultTemplateName.IndexOf("Limited") != -1,
                        DescriptionText = gameEvent.Value.PlayerEvent.EventUXInfo.EventComponentData.DescriptionText.LocKey,
                        Chests = ChestsList
                    });
                }
                WriteToLog("Events", gameEventsOutput);
            }
            catch (Exception e)
            {
                WriteToLog("ErrorGetInitialData", e);
            }
        }

        private void GetInventoryData()
        {
            try
            {
                gotInventoryData = true;
                WrapperController.Instance.InventoryManager.UnsubscribeFromAll(InventoryChangeHandler);
                WrapperController.Instance.InventoryManager.SubscribeToAll(InventoryChangeHandler);

                WriteToLog("Collection", WrapperController.Instance.InventoryManager.Cards);
                WriteToLog("InventoryContent", WrapperController.Instance.InventoryManager.Inventory);

                Task task = new Task(() => PeriodicCollectionPrinter());
                task.Start();
            }
            catch (Exception e)
            {
                WriteToLog("ErrorGetInitialData", e);
            }
        }

        /*private void onWrapperSceneLoaded(object obj)
        {
            WriteToLog("onWrapperSceneLoaded", obj);
            WriteToLog("onWrapperSceneLoaded", PAPA.SceneLoading.CurrentScene);
            if (WrapperController.Instance.PostMatchClientUpdate != null)
            {
                WriteToLog("onWrapperSceneLoadedPostMatchClientUpdate", WrapperController.Instance.PostMatchClientUpdate);
            }
        }

        private void onDuelSceneLoaded(UnityEngine.SceneManagement.LoadSceneMode obj)
        {
            WriteToLog("onDuelSceneLoaded", obj);
            WriteToLog("onDuelSceneLoaded", PAPA.SceneLoading.CurrentScene);
            if (WrapperController.Instance.PostMatchClientUpdate != null)
            {
                WriteToLog("onWrapperSceneLoadedPostMatchClientUpdate", WrapperController.Instance.PostMatchClientUpdate);
            }
        }*/

        private void PeriodicCollectionPrinter()
        {
            try
            {
                Thread.Sleep(600000);
                WriteToLog("Collection", WrapperController.Instance.InventoryManager.Cards);
                WriteToLog("InventoryContent", WrapperController.Instance.InventoryManager.Inventory);
                PeriodicCollectionPrinter();
            }
            catch (Exception e)
            {
                WriteToLog("ErrorPeriodicCollectionPrinter", e);
            }
        }

        private void AccountClient_LoginStateChanged(LoginState obj)
        {
            try
            {
                WriteToLog("LoginStateChanged", obj);
                gotInventoryData = false;
                gotLoginData = false;
                gotRankInfo = false;
                dataWrittenHashes.Clear();
                Task task = new Task(() => GetHoldOnPapa());
                task.Start();
            }
            catch (Exception e)
            {
                WriteToLog("ErrorLoginStateChanged", e);
            }
        }

        private void InventoryChangeHandler(ClientInventoryUpdateReportItem obj)
        {
            try
            {
                WriteToLog("InventoryUpdate", obj);
            }
            catch (Exception e)
            {
                WriteToLog("ErrorInventoryChangeHandler", e);
            }
        }


    }
}
