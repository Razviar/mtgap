// tslint:disable:no-require-imports no-unsafe-any no-var-requires
require('source-map-support').install();
// tslint:enable:no-require-imports no-unsafe-any no-var-requires

import {app} from 'electron';
import isDev from 'electron-is-dev';

import {setAccounts, setCreds} from 'root/app/auth';
import {enableAutoLauncher} from 'root/app/auto_launcher';
import {setupAutoUpdater, updateHunter} from 'root/app/auto_updater';
import {setupIpcMain} from 'root/app/ipc_main';
import {createMainWindow, getMainWindow, withMainWindow} from 'root/app/main_window';
import {setupProcessWatcher} from 'root/app/process_watcher';
import {createLogParser} from 'root/lib/log_parser';
import {Store} from 'root/lib/storage';

setupAutoUpdater();

// tslint:disable-next-line: no-var-requires
if (require('electron-squirrel-startup')) {
  app.quit();
}

export const store = new Store({
  configName: 'user-preferences',
  defaults: {},
});

const processWatcherFn = setupProcessWatcher();

function recreateMainWindow(): void {
  createMainWindow(() => {
    createLogParser();
    withMainWindow(w => {
      w.show();
      w.webContents.on('did-finish-load', () => {
        withMainWindow(w => w.webContents.send('set-version', app.getVersion()));
        setCreds('ready-to-show');
        setAccounts();
        if (!isDev) {
          updateHunter();
        }
      });
      if (store.get('minimized')) {
        w.minimize();
      }
    });
    setInterval(processWatcherFn, 250);
  });
}

const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    withMainWindow(w => {
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

  app.on('activate', () => {
    if (!getMainWindow()) {
      recreateMainWindow();
    }
  });
}

if (store.get(store.get('usertoken'), 'autorun')) {
  enableAutoLauncher();
}

setupIpcMain(app);
