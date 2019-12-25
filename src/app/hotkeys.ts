import {globalShortcut} from 'electron';

import {sendMessageToOverlayWindow} from 'root/app/messages';
import {settingsStore} from 'root/app/settings-store/settings_store';

export function registerHotkeys(): void {
  if (settingsStore.get().nohotkeys) {
    return;
  }

  if (!globalShortcut.isRegistered('Alt+Q')) {
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
    globalShortcut.register('Alt+A', () => {
      sendMessageToOverlayWindow('scale-up', undefined);
    });
    globalShortcut.register('Alt+S', () => {
      sendMessageToOverlayWindow('scale-down', undefined);
    });
    globalShortcut.register('Alt+E', () => {
      sendMessageToOverlayWindow('opacity-up', undefined);
    });
    globalShortcut.register('Alt+D', () => {
      sendMessageToOverlayWindow('opacity-down', undefined);
    });
  }
}

export function unRegisterHotkeys(): void {
  if (globalShortcut.isRegistered('Alt+Q')) {
    globalShortcut.unregisterAll();
  }
}
