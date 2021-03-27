import {sendMessageToHomeWindow} from 'root/app/messages';
import {settingsStore} from 'root/app/settings-store/settings_store';
import {isMac} from 'root/lib/utils';

export function setCreds(source: string): void {
  const account = settingsStore.getAccount();

  if (account) {
    sendMessageToHomeWindow('set-creds', {account, source});
    if (!account.hotkeysSettings) {
      account.hotkeysSettings = {
        'hk-my-deck': 'Q',
        'hk-opp-deck': 'W',
        'hk-overlay': '`',
        'hk-inc-size': 'A',
        'hk-dec-size': 'S',
        'hk-inc-opac': 'E',
        'hk-dec-opac': 'D',
        'hk-restart-mtga': 'R',
      };
      settingsStore.save();
    }
    sendMessageToHomeWindow('set-hotkey-map', account.hotkeysSettings);
    if (!account.overlaySettings) {
      account.overlaySettings = {
        leftdigit: 2,
        rightdigit: 1,
        leftdraftdigit: 3,
        rightdraftdigit: 1,
        bottomdigit: 3,
        hidemy: false,
        hideopp: false,
        hidezero: false,
        showcardicon: true,
        neverhide: false,
        mydecks: false,
        cardhover: false,
        timers: false,
        savepositiontop: 0,
        savepositionleft: 0,
        savepositiontopopp: 0,
        savepositionleftopp: 0,
        savescale: 0,
        opacity: 0,
        fontcolor: 0,
        detach: false,
        hidemain: false,
        interactive: !isMac(),
      };
      settingsStore.save();
    }
    sendMessageToHomeWindow('set-o-settings', account.overlaySettings);
  }
}

export function sendSettingsToRenderer(): void {
  sendMessageToHomeWindow('set-settings', settingsStore.get());
}
