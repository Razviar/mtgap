import {App} from 'electron';

import {LORtokencheck, lortokenrequest} from 'root/api/LOR/loruserbytokenid';
import {setCreds} from 'root/app/auth';
import {onMessageFromBrowserWindow, sendMessageToHomeWindow} from 'root/app/messages';
import {settingsStore} from 'root/app/settings-store/settings_store';
import {error} from 'root/lib/logger';

export function setupLorIpcMain(app: App): void {
  onMessageFromBrowserWindow('lor-start-sync', (_) => {
    lortokenrequest()
      .then((res) => {
        sendMessageToHomeWindow('lor-sync-process', res);
      })
      .catch((err) => {
        error('Failure to perform LORtokenrequest', err);
      });
  });

  onMessageFromBrowserWindow('lor-token-waiter', (request) => {
    LORtokencheck(request)
      .then((res) => {
        sendMessageToHomeWindow('lor-token-waiter-responce', {res, request});
      })
      .catch((err) => {
        error('Failure to perform tokencheck', err, {request});
      });
  });

  onMessageFromBrowserWindow('game-switch', (game) => {
    const settings = settingsStore.get();
    settings.lastGame = game;
    settingsStore.save();
    setCreds('game-switch');
  });
}
