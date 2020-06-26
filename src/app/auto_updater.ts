import {app, autoUpdater} from 'electron';
import electronIsDev from 'electron-is-dev';

import {withHomeWindow} from 'root/app/main_window';
import {sendMessageToHomeWindow} from 'root/app/messages';
import {showNotification} from 'root/app/notification';
import {settingsStore} from 'root/app/settings-store/settings_store';
import {NetworkStatusMessage} from 'root/lib/messages';

let checkingUpdate = false;
let manualCheck = false;
const updateTimeout = 600000;
const updatesEnabled = !electronIsDev;
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
      sendMessageToHomeWindow('network-status', {
        active: true,
        message: NetworkStatusMessage.Connected,
      });
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
      sendMessageToHomeWindow('network-status', {
        active: true,
        message: NetworkStatusMessage.CheckingUpdates,
      });
    });

    autoUpdater.on('update-available', () => {
      if (manualCheck) {
        sendMessageToHomeWindow('show-prompt', {message: 'Downloading update...', autoclose: 0});
      }
      sendMessageToHomeWindow('network-status', {
        active: true,
        message: NetworkStatusMessage.DownloadingUpdates,
      });
    });

    autoUpdater.on('update-downloaded', (e: Event, notes: string, version: string, date: Date, dlUrl: string) => {
      if (!settingsStore.get().manualUpdate) {
        if (manualCheck) {
          manualCheck = false;
          sendMessageToHomeWindow('show-prompt', {
            message: `Downloaded version ${version}. Restarting app...`,
            autoclose: 0,
          });
        }
        autoUpdater.quitAndInstall();
      } else {
        sendMessageToHomeWindow('show-prompt', {
          message: `Version ${version} available for installation!`,
          autoclose: 0,
        });
        sendMessageToHomeWindow('show-update-button', version);
        sendMessageToHomeWindow('network-status', {
          active: true,
          message: NetworkStatusMessage.Connected,
        });
        withHomeWindow((w) => {
          if (!w.isVisible()) {
            showNotification(
              'MTGA Pro Tracker Update',
              'Updated is downloaded and ready to be applied. Since you have manual updates switched on, you need to click Apply Update button.'
            );
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
