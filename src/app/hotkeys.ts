import {globalShortcut} from 'electron';

import {sendMessageToOverlayWindow} from 'root/app/messages';
import {settingsStore} from 'root/app/settings-store/settings_store';

export function registerHotkeys(): void {
  if (settingsStore.get().nohotkeys) {
    return;
  }

  let hotkeyMap = settingsStore.getAccount()?.hotkeysSettings;

  if (hotkeyMap === undefined) {
    hotkeyMap = {
      'hk-my-deck': 'Q',
      'hk-opp-deck': 'W',
      'hk-overlay': '`',
      'hk-inc-size': 'A',
      'hk-dec-size': 'S',
      'hk-inc-opac': 'E',
      'hk-dec-opac': 'D',
      'hk-restart-mtga': 'R',
    };
  }

  const HotkeysBinding = {
    'hk-my-deck': 'toggle-me',
    'hk-opp-deck': 'toggle-opp',
    'hk-overlay': 'toggle-all',
    'hk-inc-size': 'scale-up',
    'hk-dec-size': 'scale-down',
    'hk-inc-opac': 'opacity-up',
    'hk-dec-opac': 'opacity-down',
    'hk-restart-mtga': 'restart-mtga',
  };

  Object.keys(hotkeyMap).forEach((key) => {
    const hotkey = key as
      | 'hk-my-deck'
      | 'hk-opp-deck'
      | 'hk-overlay'
      | 'hk-inc-size'
      | 'hk-dec-size'
      | 'hk-inc-opac'
      | 'hk-dec-opac'
      | 'hk-restart-mtga';
    const action = HotkeysBinding[hotkey] as
      | 'toggle-me'
      | 'toggle-opp'
      | 'toggle-all'
      | 'scale-up'
      | 'scale-down'
      | 'opacity-up'
      | 'opacity-down'
      | 'restart-mtga';
    if (hotkeyMap && hotkeyMap[hotkey]) {
      if (!globalShortcut.isRegistered(`Alt+${hotkeyMap[hotkey]}`)) {
        globalShortcut.register(`Alt+${hotkeyMap[hotkey]}`, () => {
          sendMessageToOverlayWindow(action, undefined);
        });
      }
    }
  });
}

export function unRegisterHotkeys(): void {
  globalShortcut.unregisterAll();
}
