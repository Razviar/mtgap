import {sendMessageToHomeWindow} from 'root/app/messages';
import {settingsStore} from 'root/app/settings-store/settings_store';

export function setCreds(source: string): void {
  const account = settingsStore.getAccount();
  if (account) {
    sendMessageToHomeWindow('set-creds', {account, source});
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
      };
      settingsStore.save();
    }
    sendMessageToHomeWindow('set-o-settings', account.overlaySettings);
  }
}

export function sendSettingsToRenderer(): void {
  sendMessageToHomeWindow('set-settings', settingsStore.get());
}
