import {withMainWindow} from 'root/app/main_window';
import {store} from 'root/main';

export function setCreds(source: string): void {
  //console.log('setCreds:' + source);
  const token = store.get('usertoken');
  if (token) {
    const uid = store.get(token, 'uid');
    const nick = store.get(token, 'nick');
    if (uid && nick) {
      withMainWindow(w => w.webContents.send('set-creds', {token, uid, nick, source}));
    }
  }
}

export function setAccounts(): void {
  const accounts = store.get('settings');
  if (accounts) {
    withMainWindow(w => w.webContents.send('set-accounts', accounts));
  }
  const settings = {
    autorun: store.get('autorun'),
    minimized: store.get('minimized'),
    logpath: store.get('logpath'),
  };
  withMainWindow(w => w.webContents.send('set-settings', settings));
}
