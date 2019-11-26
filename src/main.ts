// tslint:disable:no-require-imports no-unsafe-any no-var-requires
require('source-map-support').install();
// tslint:enable:no-require-imports no-unsafe-any no-var-requires

import {app} from 'electron';

import {setAccounts, setCreds} from 'root/app/auth';
import {enableAutoLauncher} from 'root/app/auto_launcher';
import {setupAutoUpdater} from 'root/app/auto_updater';
import {createMainWindow, getMainWindow, withMainWindow} from 'root/app/main_window';
import {ConnectionWaiter} from 'root/lib/connection_waiter';
import {createLogParser} from 'root/lib/log_parser';
import {error} from 'root/lib/logger';
import {LogParser} from 'root/lib/logparser';
import {Store} from 'root/lib/storage';
import {ProcessWatcher} from 'root/lib/watchprocess';
import {setupIpcMain} from 'root/app/ipc_main';

setupAutoUpdater();

// tslint:disable-next-line: no-var-requires
if (require('electron-squirrel-startup')) {
  app.quit();
}

export const store = new Store({
  configName: 'user-preferences',
  defaults: {},
});

export let logParser: LogParser | undefined;
export let MTGApid = -1;
export const processWatcher: ProcessWatcher = new ProcessWatcher('MTGA.exe');
export const connWait: ConnectionWaiter = new ConnectionWaiter();

function recreateMainWindow(): void {
  createMainWindow(app, () => {
    logParser = createLogParser();
    withMainWindow(w => {
      w.show();
      w.webContents.on('did-finish-load', () => {
        withMainWindow(w => w.webContents.send('set-version', app.getVersion()));
        setCreds('ready-to-show');
        setAccounts();
      });
      if (store.get(store.get('usertoken'), 'minimized')) {
        w.minimize();
      }
    });
    setInterval(intervalFunc, 1000);
  });
}

const intervalFunc = () => {
  processWatcher
    .getprocesses()
    .then(res => {
      MTGApid = res;
      if (res === -1 && connWait.status) {
        withMainWindow(w =>
          w.webContents.send('show-status', {
            color: '#dbb63d',
            message: 'Game is not running!',
          })
        );
      }
    })
    .catch(err => error('Process watcher failed while checked for the process', err));
};

export const connectionWaiter = (timeout: number) => {
  connWait
    .pingMtga(app.getVersion())
    .then(res => {
      if (res && logParser) {
        //console.log('COnnection Restored');
        logParser.start();
      } else {
        withMainWindow(w =>
          w.webContents.send('show-status', {
            color: '#cc2d2d',
            message: 'Connection Error',
          })
        );
        setTimeout(() => {
          connectionWaiter(timeout + 1000);
        }, 1000);
      }
    })
    .catch(err => error('Connection waiter failed while pinging the server', err));
};

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
