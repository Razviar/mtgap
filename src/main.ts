import {app} from 'electron';
import electronIsDev from 'electron-is-dev';

import {sendSettingsToRenderer, setCreds} from 'root/app/auth';
import {enableAutoLauncher} from 'root/app/auto_launcher';
import {setupAutoUpdater} from 'root/app/auto_updater';
import {doMtgaPathOps} from 'root/app/do-path-ops';
import {setupIpcMain} from 'root/app/ipc_main';
import {createGlobalLogParser} from 'root/app/log_parser_manager';
import {createMainWindow, withHomeWindow} from 'root/app/main_window';
import {sendMessageToHomeWindow} from 'root/app/messages';
import {permissionManager} from 'root/app/permission_manager';
import {settingsStore} from 'root/app/settings-store/settings_store';
import {error} from 'root/lib/logger';
import {isMac} from 'root/lib/utils';

const HALF_SECOND = 500;

// tslint:disable-next-line: no-var-requires no-unsafe-any no-require-imports
require('source-map-support').install();

// tslint:disable-next-line: no-var-requires no-unsafe-any no-require-imports
if (require('root/electron-squirrel-startup')) {
  app.quit();
}

let mainWindowCreated = false;

permissionManager.init();

function initTrackerAndUi(): void {
  createGlobalLogParser(electronIsDev);
  //createGlobalLorParser();
  if (electronIsDev) {
    sendMessageToHomeWindow('show-dev-buttons', undefined);
  }
  setCreds('ready-to-show');
  sendSettingsToRenderer();
}

function recreateMainWindow(): void {
  mainWindowCreated = true;
  //setupRequestIntercept(app);
  createMainWindow();
  doMtgaPathOps();

  withHomeWindow((w) => {
    if (settingsStore.get().minimized) {
      w.hide();
    } else if (!w.isVisible()) {
      w.once('ready-to-show', () => w.show());
    }
    w.webContents.on('did-finish-load', () => {
      sendMessageToHomeWindow('set-version', app.getVersion());
      sendMessageToHomeWindow('startup-title', isMac() ? 'Start tracker on system startup' : 'Start with Windows');
      if (isMac()) {
        permissionManager.requireAccessibility();
        permissionManager.on('accessibility', (authorized) => {
          if (authorized) {
            initTrackerAndUi();
          } else {
            app.relaunch();
            app.exit();
          }
        });
        permissionManager.on('screenRecording', (authorized) => {
          sendMessageToHomeWindow('screen-recording-authorized', authorized);
        });
      } else {
        sendMessageToHomeWindow('screen-recording-authorized', true);
        initTrackerAndUi();
      }
    });
    setupAutoUpdater();
  });
}

const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    withHomeWindow((w) => {
      if (!w.isVisible()) {
        w.show();
      }
      w.focus();
    });
  });

  app.on('ready', () => setTimeout(recreateMainWindow, HALF_SECOND));

  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
      app.quit();
    }
  });

  if (isMac()) {
    app.dock.hide();
    app.on('activate', () => {
      if (!mainWindowCreated) {
        recreateMainWindow();
      } else {
        withHomeWindow((w) => w.show());
      }
    });
  }
}

if (settingsStore.get().autorun) {
  enableAutoLauncher();
}

setupIpcMain(app);
//setupLorIpcMain(app);

process.on('uncaughtException', (err) => {
  error('Uncaught error in main process', err);
  app.exit();
});
