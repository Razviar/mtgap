import {BrowserWindow, ipcMain} from 'electron';

import {withHomeWindow} from 'root/app/main_window';
import {withOverlayWindow} from 'root/app/overlay_window';
import {Messages} from 'root/lib/messages';

export function sendMessageToHomeWindow<Message extends keyof Messages>(
  message: Message,
  data: Messages[Message]
): void {
  withHomeWindow(_ => sendMessageToBrowserWindow(_, message, data));
}

export function sendMessageToOverlayWindow<Message extends keyof Messages>(
  message: Message,
  data: Messages[Message]
): void {
  withOverlayWindow(_ => sendMessageToBrowserWindow(_, message, data));
}

function sendMessageToBrowserWindow<Message extends keyof Messages>(
  browserWindow: BrowserWindow,
  message: Message,
  data: Messages[Message]
): void {
  browserWindow.webContents.send(message, data);
}

export function onMessageFromBrowserWindow<Message extends keyof Messages>(
  message: Message,
  cb: (data: Messages[Message]) => void
): void {
  ipcMain.on(message, (_, args) => {
    cb(args as Messages[Message]);
  });
}
