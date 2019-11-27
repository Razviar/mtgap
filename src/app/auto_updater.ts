import {app, autoUpdater, Notification} from 'electron';
import isDev from 'electron-is-dev';
import path from 'path';

import {getAppIcon} from 'root/app/app_icon';
import {withHomeWindow} from 'root/app/main_window';
import {sendMessageToHomeWindow} from 'root/app/messages';
import {settingsStore} from 'root/app/settings_store';

let checkingUpdate = false;
let manualCheck = false;
const updateTimeout = 600000;
const updatesEnabled = !isDev;
const server = 'https://update.electronjs.org';

const updatesHunter = () => {
  if (!checkingUpdate) {
    checkingUpdate = true;
    autoUpdater.checkForUpdates();
  }
  setTimeout(updatesHunter, updateTimeout);
};

export function setupAutoUpdater(): void {
  if (updatesEnabled) {
    const url = `${server}/Razviar/mtgap/${process.platform}-${process.arch}/${app.getVersion()}`;

    autoUpdater.setFeedURL({url});

    autoUpdater.on('update-not-available', () => {
      checkingUpdate = false;
      if (manualCheck) {
        manualCheck = false;
        sendMessageToHomeWindow('show-prompt', {message: 'You have the latest version!', autoclose: 2000});
      }
    });

    autoUpdater.on('error', () => {
      checkingUpdate = false;
      if (manualCheck) {
        manualCheck = false;
        sendMessageToHomeWindow('show-prompt', {message: 'Error while checking updates!', autoclose: 2000});
      }
    });

    autoUpdater.on('checking-for-update', () => {
      if (manualCheck) {
        sendMessageToHomeWindow('show-prompt', {message: 'Checking updates...', autoclose: 0});
      }
    });

    autoUpdater.on('update-available', () => {
      if (manualCheck) {
        sendMessageToHomeWindow('show-prompt', {message: 'Downloading update...', autoclose: 0});
      }
    });

    autoUpdater.on('update-downloaded', () => {
      if (!settingsStore.get().manualUpdate) {
        if (manualCheck) {
          manualCheck = false;
          sendMessageToHomeWindow('show-prompt', {message: 'Download complete. Restarting app...', autoclose: 0});
        }
        autoUpdater.quitAndInstall();
      } else {
        sendMessageToHomeWindow('show-prompt', {message: 'New version available for installation!', autoclose: 0});
        sendMessageToHomeWindow('show-update-button', undefined);
        withHomeWindow(w => {
          if (!w.isVisible()) {
            const notification = new Notification({
              title: 'MTGA Pro Tracker Update',
              body:
                'Updated is downloaded and ready to be applied. Since you have manual updates switched on, you need to click Apply Update button.',
              icon: path.join(__dirname, getAppIcon()),
            });
            notification.show();
          }
        });
      }
    });

    updatesHunter();
  }
}

export function checkForUpdates(): void {
  if (updatesEnabled && !checkingUpdate) {
    checkingUpdate = true;
    manualCheck = true;
    autoUpdater.checkForUpdates();
  }
}

export function quitAndInstall(): void {
  autoUpdater.quitAndInstall();
}
