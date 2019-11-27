import {app, autoUpdater, Notification} from 'electron';
import isDev from 'electron-is-dev';
import path from 'path';

import {getAppIcon} from 'root/app/app_icon';
import {withMainWindow} from 'root/app/main_window';
import {settingsStore} from 'root/lib/settings_store';

let waitingToUpdate = false;
const UpdateTimeout = 600000;

const UpdatesHunter = () => {
  autoUpdater.checkForUpdates();
  setTimeout(UpdatesHunter, UpdateTimeout);
  if (!waitingToUpdate) {
    setTimeout(() => {
      UpdatesHunter();
      // tslint:disable-next-line: no-magic-numbers
    }, 600000);
  }
};

export function setupAutoUpdater(): void {
  if (!isDev) {
    const server = 'https://update.electronjs.org';
    const feed = `${server}/Razviar/mtgap/${process.platform}-${process.arch}/${app.getVersion()}`;
    const manualupdate = settingsStore.get().manualUpdate;

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

      withMainWindow(w => w.webContents.send('showprompt', {message: 'Download complete.', autoclose: 1000}));
      const updateNotification = new Notification({
        title: 'MTGA Pro Tracker Update',
        body:
          'Updated is downloaded and ready to be applied. Since you have manual updates switched on, you need to click Apply Update button.',
        icon: path.join(__dirname, getAppIcon()),
      });
      if (!manualupdate) {
        autoUpdater.quitAndInstall();
      } else {
        waitingToUpdate = true;
        updateNotification.show();
      }
    });

    UpdatesHunter();
  }
}

export function checkForUpdates(): void {
  autoUpdater.checkForUpdates();
}

export function updateHunter(): void {
  UpdatesHunter();
}

export function quitAndInstall(): void {
  autoUpdater.quitAndInstall();
}
