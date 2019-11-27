import {withMainWindow} from 'root/app/main_window';
import {settingsStore} from 'root/lib/settings_store';

export function setCreds(source: string): void {
  const session = settingsStore.getAccount();
  if (session) {
    const {uid, nick, token} = session;
    withMainWindow(w => w.webContents.send('set-creds', {token, uid, nick, source}));
  }
}

export function sendSettingsToRenderer(): void {
  withMainWindow(w => w.webContents.send('set-settings', settingsStore.get()));
}
