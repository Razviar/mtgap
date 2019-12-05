import {Message, MessageCallback, Messages, onBridgeMessageGeneric, onMessageGeneric} from 'root/lib/messages';

export function sendMessageToIpcMain(message: Message, data: Messages[Message]): void {
  window.postMessage({message, data}, '*');
}

const allCallbacks = new Map<Message, MessageCallback<Message>[]>();

window.addEventListener('message', (ev: MessageEvent) => {
  onBridgeMessageGeneric(allCallbacks, ev.data);
});

export function onMessageFromIpcMain<M extends Message>(message: M, cb: MessageCallback<M>): void {
  onMessageGeneric(allCallbacks, message, cb);
}
