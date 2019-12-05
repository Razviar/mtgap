import {MessagePayload, Messages} from 'root/lib/messages';

export function sendMessageToIpcMain<Message extends keyof Messages>(message: Message, data: Messages[Message]): void {
  window.postMessage({message, data}, '*');
}

type MessageCallback = (data: Messages[keyof Messages]) => void;
type MessageCallbackList = {
  [Message in keyof Messages]?: MessageCallback[];
};

const allCallbacks: MessageCallbackList = {};

window.addEventListener('message', function(this: Window, ev: MessageEvent): void {
  const payload = ev.data as MessagePayload;
  const callbacks = allCallbacks[payload.message];
  if (callbacks !== undefined) {
    for (const cb of callbacks) {
      cb(payload.data);
    }
  }
});

export function onMessageFromIpcMain(message: keyof Messages, cb: MessageCallback): void {
  const callbacks = allCallbacks[message];
  if (callbacks !== undefined) {
    callbacks.push(cb);
  } else {
    allCallbacks[message] = [cb];
  }
}
