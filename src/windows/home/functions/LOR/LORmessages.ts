import {LORlogin} from 'root/windows/home/functions/LOR/LORlogin';
import {LORtokenWaiter} from 'root/windows/home/functions/tokenWaiter';
import {HomePageElements} from 'root/windows/home/home';
import {onMessageFromIpcMain, sendMessageToIpcMain} from 'root/windows/messages';

export function installLorHomeMessages(): void {
  onMessageFromIpcMain('lor-sync-process', (res) => {
    sendMessageToIpcMain('open-link', `https://runeterra-decks.pro/sync/?request=${res.request}`);
    HomePageElements.LordirectSyncLink.innerHTML = `<div class="directSyncLink">https://runeterra-decks.pro/sync/?request=${res.request}</div>`;
    LORtokenWaiter(res.request);
  });

  onMessageFromIpcMain('lor-token-waiter-responce', (response) => {
    if (response.res && response.res.token) {
      LORlogin(response.res.token, response.res.uid, response.res.nick);
    } else {
      setTimeout(() => {
        LORtokenWaiter(response.request);
      }, 1000);
    }
  });
}
