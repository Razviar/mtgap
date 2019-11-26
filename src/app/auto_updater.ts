import {app, autoUpdater} from 'electron';
import electronIsDev from 'electron-is-dev';

import {getMainWindow, withMainWindow} from 'root/app/main_window';

export function setupAutoUpdater(): void {
  const UpdateTimeout = 600000;

  const UpdatesHunter = () => {
    //autoUpdater.checkForUpdates();
    setTimeout(UpdatesHunter, UpdateTimeout);
  };

  if (!electronIsDev) {
    const server = 'https://update.electronjs.org';
    const feed = `${server}/Razviar/mtgap/${process.platform}-${process.arch}/${app.getVersion()}`;

    autoUpdater.setFeedURL({url: feed});
    autoUpdater.on('update-not-available', () => {
      withMainWindow(w => w.webContents.send('showprompt', {message: 'You have latest version!', autoclose: 1000}));
    });
    autoUpdater.on('error', () => {
      withMainWindow(w =>
        w.webContents.send('showprompt', {message: 'Error while checking updates!', autoclose: 1000})
      );
    });
    autoUpdater.on('checking-for-update', () => {
      withMainWindow(w => w.webContents.send('showprompt', {message: 'Checking updates...', autoclose: 0}));
    });
    autoUpdater.on('update-available', () => {
      withMainWindow(w => w.webContents.send('showprompt', {message: 'Downloading update...', autoclose: 0}));
    });
    autoUpdater.on('update-downloaded', () => {
      withMainWindow(w =>
        w.webContents.send('showprompt', {message: 'Download complete. Restarting app...', autoclose: 0})
      );
      autoUpdater.quitAndInstall();
    });

    UpdatesHunter();
  }
}

export function checkForUpdates(): void {
  autoUpdater.checkForUpdates();
}
