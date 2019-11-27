import {sendMessageToHomeWindow} from 'root/app/messages';
import {settingsStore} from 'root/app/settings_store';

export function setCreds(source: string): void {
  const account = settingsStore.getAccount();
  if (account) {
    sendMessageToHomeWindow('set-creds', {account, source});
  }
}

export function sendSettingsToRenderer(): void {
  sendMessageToHomeWindow('set-settings', settingsStore.get());
}
