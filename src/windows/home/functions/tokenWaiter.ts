import {sendMessageToIpcMain} from 'root/windows/messages';

export function tokenWaiter(request: string): void {
  sendMessageToIpcMain('token-waiter', request);
}
