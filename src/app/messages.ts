import {BrowserWindow, ipcMain, IpcMainEvent} from 'electron';

import {withHomeWindow} from 'root/app/main_window';
import {withOverlayWindow} from 'root/app/overlay_window';
import {Message, MessageCallback, Messages, onBridgeMessageGeneric, onMessageGeneric} from 'root/lib/messages';

export function sendMessageToHomeWindow<M extends Message>(message: M, data: Messages[M]): void {
  withHomeWindow(_ => sendMessageToBrowserWindow(_, message, data));
}

export function sendMessageToOverlayWindow<M extends Message>(message: M, data: Messages[M]): void {
  withOverlayWindow(_ => sendMessageToBrowserWindow(_, message, data));
}

function sendMessageToBrowserWindow<M extends Message>(
  browserWindow: BrowserWindow,
  message: M,
  data: Messages[M]
): void {
  browserWindow.webContents.send('bridge-message', {message, data});
}

const allCallbacks = new Map<Message, MessageCallback<Message>[]>();

// tslint:disable-next-line: no-any
ipcMain.on('bridge-message', function<M extends Message>(_: IpcMainEvent, data: any): void {
  onBridgeMessageGeneric(allCallbacks, data);
});

export function onMessageFromBrowserWindow<M extends Message>(message: M, cb: MessageCallback<M>): void {
  onMessageGeneric(allCallbacks, message, cb);
}
