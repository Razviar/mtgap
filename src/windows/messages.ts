import {ipcRenderer} from 'electron';

import {Messages} from 'root/lib/messages';

export function sendMessageToIpcMain<Message extends keyof Messages>(message: Message, data: Messages[Message]): void {
  ipcRenderer.send(message, data);
}

export function onMessageFromIpcMain<Message extends keyof Messages>(
  message: Message,
  cb: (data: Messages[Message]) => void
): void {
  ipcRenderer.on(message, (_, args) => {
    cb(args as Messages[Message]);
  });
}
