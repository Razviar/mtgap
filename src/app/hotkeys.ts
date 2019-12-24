import {globalShortcut} from 'electron';

import {sendMessageToOverlayWindow} from 'root/app/messages';

export function registerHotkeys(): void {
  globalShortcut.register('Alt+Q', () => {
    sendMessageToOverlayWindow('toggle-me', undefined);
  });
  globalShortcut.register('Alt+W', () => {
    sendMessageToOverlayWindow('toggle-opp', undefined);
  });
  globalShortcut.register('Alt+~', () => {
    sendMessageToOverlayWindow('toggle-all', undefined);
  });
  globalShortcut.register('Alt+`', () => {
    sendMessageToOverlayWindow('toggle-all', undefined);
  });
}
