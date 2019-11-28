// tslint:disable-next-line: no-var-requires no-unsafe-any no-require-imports
require('source-map-support').install();

import {app} from 'electron';

import {sendSettingsToRenderer, setCreds} from 'root/app/auth';
import {enableAutoLauncher} from 'root/app/auto_launcher';
import {setupAutoUpdater} from 'root/app/auto_updater';
import {setupIpcMain} from 'root/app/ipc_main';
import {createLogParser} from 'root/app/log_parser';
import {createMainWindow, withHomeWindow} from 'root/app/main_window';
import {sendMessageToHomeWindow} from 'root/app/messages';
import {setupProcessWatcher} from 'root/app/process_watcher';
import {settingsStore} from 'root/app/settings_store';
import {asString, asNumberString} from 'root/lib/type_utils';

// tslint:disable-next-line: no-var-requires no-unsafe-any no-require-imports
if (require('electron-squirrel-startup')) {
  app.quit();
}

const processWatcherFn = setupProcessWatcher();
const processWatcherFnInterval = 250;

function recreateMainWindow(): void {
  createMainWindow();
  createLogParser();
  withHomeWindow(w => {
    if (settingsStore.get().minimized) {
      w.hide();
    } else if (!w.isVisible()) {
      w.once('ready-to-show', () => w.show());
    }
    w.webContents.on('did-finish-load', () => {
      sendMessageToHomeWindow('set-version', app.getVersion());
      setCreds('ready-to-show');
      sendSettingsToRenderer();
    });
    setupAutoUpdater();
  });
  setInterval(processWatcherFn, processWatcherFnInterval);
}

const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    withHomeWindow(w => {
      if (w.isMinimized()) {
        w.restore();
      }
      w.focus();
    });
  });

  app.on('ready', recreateMainWindow);

  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
      app.quit();
    }
  });

  // ONLY FOR MAC
  // app.on('activate', () => {
  //   if (!getMainWindow()) {
  //     recreateMainWindow();
  //   }
  // });
}

if (settingsStore.get().autorun) {
  enableAutoLauncher();
}

setupIpcMain(app);
