import {sendMessageToIpcMain} from 'root/windows/messages';

export function tokenWaiter(request: string): void {
  sendMessageToIpcMain('token-waiter', request);
}

export function LORtokenWaiter(request: string): void {
  sendMessageToIpcMain('lor-token-waiter', request);
}
