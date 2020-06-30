/* eslint-disable new-cap */
// tslint:disable: no-unsafe-any
import {Library} from 'ffi-napi';
import {address, alloc, get, isNull, refType} from 'ref-napi';
import struct from 'ref-struct-napi';

// Create the struct required to save the window bounds
const Rect = struct({
  left: 'long',
  top: 'long',
  right: 'long',
  bottom: 'long',
});
const RectPointer = refType(Rect);

// Required by QueryFullProcessImageName
// https://msdn.microsoft.com/en-us/library/windows/desktop/ms684880(v=vs.85).aspx
const PROCESS_QUERY_LIMITED_INFORMATION = 0x1000;

// Create FFI declarations for the C++ library and functions needed (User32.dll), using their "Unicode" (UTF-16) version
const user32 = new Library('User32.dll', {
  // https://msdn.microsoft.com/en-us/library/windows/desktop/ms633505(v=vs.85).aspx
  GetForegroundWindow: ['pointer', []],
  // https://msdn.microsoft.com/en-us/library/windows/desktop/ms633522(v=vs.85).aspx
  GetWindowThreadProcessId: ['uint32', ['pointer', 'uint32 *']],
  // Get window bounds function
  // https://docs.microsoft.com/en-us/windows/desktop/api/winuser/nf-winuser-getwindowrect
  GetWindowRect: ['bool', ['pointer', RectPointer]],
  GetWindowModuleFileNameA: ['uint', ['pointer', 'pointer', 'uint']],
});

function windows() {
  // Windows C++ APIs' functions are declared with capitals, so this rule has to be turned off

  // Get a "handle" of the active window
  const activeWindowHandle = user32.GetForegroundWindow();

  if (isNull(activeWindowHandle)) {
    return undefined; // Failed to get active window handle
  }

  // Get memory address of the window handle as the "window ID"
  const windowId = address(activeWindowHandle);

  // Allocate a buffer to store the process ID
  const processIdBuffer = alloc('uint32');
  // Write the process ID creating the window to the buffer (it returns the thread ID, but it's not used here)
  user32.GetWindowThreadProcessId(activeWindowHandle, processIdBuffer);
  // Get the process ID as a number from the buffer
  const processId = get(processIdBuffer);

  // Create a new instance of Rect, the struct required by the `GetWindowRect` method
  const bounds = new Rect();
  // Get the window bounds and save it into the `bounds` variable
  const getWindowRectResult = user32.GetWindowRect(activeWindowHandle, bounds.ref());

  if (getWindowRectResult === 0) {
    return undefined; // Failed to get window rect
  }

  return {
    platform: 'windows',
    id: windowId,
    owner: {
      processId,
    },
    bounds: {
      x: bounds.left,
      y: bounds.top,
      width: bounds.right - bounds.left,
      height: bounds.bottom - bounds.top,
    },
  };

  /* eslint-enable new-cap */
}

export default () => Promise.resolve(windows());
export const sync = windows;
