import {sendMessageToHomeWindow} from 'root/app/messages';
import {settingsStore} from 'root/app/settings_store';

export function setCreds(source: string): void {
  const account = settingsStore.getAccount();
  if (account) {
    sendMessageToHomeWindow('set-creds', {account, source});
    if (!account.overlaySettings) {
      account.overlaySettings = {
        leftdigit: 2,
        rightdigit: 1,
        bottomdigit: 3,
        hidemy: false,
        hideopp: false,
        hidezero: false,
        showcardicon: true,
        neverhide: false,
        mydecks: false,
        cardhover: false,
        timers: false,
      };
      settingsStore.save();
    }
    sendMessageToHomeWindow('set-o-settings', account.overlaySettings);
  }
}

export function sendSettingsToRenderer(): void {
  sendMessageToHomeWindow('set-settings', settingsStore.get());
}
