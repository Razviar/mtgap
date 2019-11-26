<<<<<<< HEAD
// tslint:disable:no-require-imports no-unsafe-any no-var-requires
require('source-map-support').install();
// tslint:enable:no-require-imports no-unsafe-any no-var-requires
=======
// tslint:disable: no-any
import {
  app,
  BrowserWindow,
  ipcMain,
  Tray,
  Menu,
  nativeImage,
  MenuItemConstructorOptions,
  shell,
  dialog,
  autoUpdater,
  Notification,
} from 'electron';
import { Store } from './lib/storage';
import { beginParsing } from './lib/beginParsing';
import { LogParser } from './lib/logparser';
import { ProcessWatcher } from './lib/watchprocess';
import path from 'path';
import { setuserdata } from './api/userbytokenid';
import { ConnectionWaiter } from './lib/connectionwaiter';
import isDev from 'electron-is-dev';
import AutoLaunch from 'auto-launch';
import { WindowLocator } from './lib/locatewindow';
>>>>>>> f50c09694b48994ce41d459833507ce3daa89ed2

import {app} from 'electron';

<<<<<<< HEAD
import {setAccounts, setCreds} from 'root/app/auth';
import {enableAutoLauncher} from 'root/app/auto_launcher';
import {setupAutoUpdater} from 'root/app/auto_updater';
import {setupIpcMain} from 'root/app/ipc_main';
import {createMainWindow, getMainWindow, withMainWindow} from 'root/app/main_window';
import {ConnectionWaiter} from 'root/lib/connection_waiter';
import {createLogParser, withLogParser} from 'root/lib/log_parser';
import {error} from 'root/lib/logger';
import {Store} from 'root/lib/storage';
import {ProcessWatcher} from 'root/lib/watchprocess';

setupAutoUpdater();
=======
let waitingToUpdate = false;

const UpdatesHunter = () => {
  autoUpdater.checkForUpdates();
  if (!waitingToUpdate) {
    setTimeout(() => {
      UpdatesHunter();
      // tslint:disable-next-line: no-magic-numbers
    }, 600000);
  }
};

export const store = new Store({
  configName: 'user-preferences',
  defaults: {},
});

const ico = store.get('icon');
let AppIcon: any;
switch (ico) {
  case '':
    // tslint:disable: no-var-requires
    AppIcon = require('root/statics/icon.ico');
    break;
  case '1':
    AppIcon = require('root/statics/icon1.ico');
    break;
  case '2':
    AppIcon = require('root/statics/icon2.ico');
    break;
  case '3':
    AppIcon = require('root/statics/icon3.ico');
    break;
  case '4':
    AppIcon = require('root/statics/icon4.ico');
    break;
}

if (!isDev) {
  const server = 'https://update.electronjs.org';
  const feed = `${server}/Razviar/mtgap/${process.platform}-${process.arch}/${app.getVersion()}`;
  const manualupdate = store.get('manualupdate');

  autoUpdater.setFeedURL({ url: feed });
  autoUpdater.on('update-not-available', () => {
    mainWindow.webContents.send('showprompt', { message: 'You have latest version!', autoclose: 1000 });
  });
  autoUpdater.on('error', () => {
    mainWindow.webContents.send('showprompt', { message: 'Error while checking updates!', autoclose: 1000 });
  });
  autoUpdater.on('checking-for-update', () => {
    mainWindow.webContents.send('showprompt', { message: 'Checking updates...', autoclose: 0 });
  });
  autoUpdater.on('update-available', () => {
    mainWindow.webContents.send('showprompt', { message: 'Downloading update...', autoclose: 0 });
  });
  autoUpdater.on('update-downloaded', () => {
    mainWindow.webContents.send('show-update-button');
    mainWindow.webContents.send('showprompt', { message: 'Download complete.', autoclose: 1000 });
    const updateNotification = new Notification({
      title: 'MTGA Pro Tracker Update',
      body:
        'Updated is downloaded and ready to be applied. Since you have manual updates switched on, you need to click Apply Update button.',
      icon: path.join(__dirname, AppIcon),
    });
    if (!manualupdate) {
      autoUpdater.quitAndInstall();
    } else {
      waitingToUpdate = true;
      updateNotification.show();
    }
  });
}

const AutoLauncher = new AutoLaunch({
  name: 'mtgaprotracker',
});
>>>>>>> f50c09694b48994ce41d459833507ce3daa89ed2

// tslint:disable-next-line: no-var-requires
if (require('electron-squirrel-startup')) {
  app.quit();
}

<<<<<<< HEAD
export const store = new Store({
  configName: 'user-preferences',
  defaults: {},
});

export let MTGApid = -1;
=======
export let mainWindow: any;
export let overlayWindow: any;
export let logParser: LogParser | undefined;
export let MTGApid = -1;
export const processWatcher: ProcessWatcher = new ProcessWatcher('MTGA.exe');
export const connWait: ConnectionWaiter = new ConnectionWaiter();
export const overlayPositioner = new WindowLocator();

export const setCreds = (source: string) => {
  //console.log('setCreds:' + source);
  const token = store.get('usertoken');
  if (token) {
    const uid = store.get(token, 'uid');
    const nick = store.get(token, 'nick');
    if (uid && nick) {
      mainWindow.webContents.send('set-creds', { token, uid, nick, source });
    }
  }
};

const setAccounts = () => {
  const accounts = store.get('settings');
  if (accounts) {
    mainWindow.webContents.send('set-accounts', accounts);
  }
  const settings = {
    autorun: store.get('autorun'),
    minimized: store.get('minimized'),
    logpath: store.get('logpath'),
    icon: store.get('icon'),
    manualupdate: store.get('manualupdate'),
  };
  mainWindow.webContents.send('set-settings', settings);
};
>>>>>>> f50c09694b48994ce41d459833507ce3daa89ed2

export const processWatcher: ProcessWatcher = new ProcessWatcher('MTGA.exe');
const intervalFunc = () => {
<<<<<<< HEAD
  processWatcher
    .getprocesses()
    .then(res => {
=======
  const MovementSensetivity = 5;
  if (processWatcher) {
    processWatcher.getprocesses().then(res => {
>>>>>>> f50c09694b48994ce41d459833507ce3daa89ed2
      MTGApid = res;
      overlayPositioner.findmtga(MTGApid);

      if (res === -1 && connWait.status) {
<<<<<<< HEAD
        withMainWindow(w =>
          w.webContents.send('show-status', {
            color: '#dbb63d',
            message: 'Game is not running!',
          })
        );
=======
        mainWindow.webContents.send('show-status', {
          color: '#dbb63d',
          message: 'Game is not running!',
        });
        if (overlayWindow) {
          overlayWindow.hide();
        }
      } else if (res !== -1) {
        if (!overlayWindow) {
          createOverlay();
        }
        if (overlayWindow && store.get('overlay')) {
          if (
            overlayPositioner.bounds.width !== 0 &&
            (Math.abs(overlayWindow.getBounds().x - overlayPositioner.bounds.x) > MovementSensetivity ||
              Math.abs(overlayWindow.getBounds().y - overlayPositioner.bounds.y) > MovementSensetivity ||
              Math.abs(overlayWindow.getBounds().width - overlayPositioner.bounds.width) > MovementSensetivity ||
              Math.abs(overlayWindow.getBounds().height - overlayPositioner.bounds.height) > MovementSensetivity)
          ) {
            /*console.log(overlayPositioner.bounds);
            console.log(overlayWindow.getBounds());*/
            if (!overlayWindow.isVisible()) {
              overlayWindow.show();
            }
            overlayWindow.setBounds(overlayPositioner.bounds);
          } else if (overlayPositioner.bounds.width === 0) {
            overlayWindow.hide();
          } else {
            if (!overlayWindow.isVisible()) {
              overlayWindow.show();
            }
          }
        }
>>>>>>> f50c09694b48994ce41d459833507ce3daa89ed2
      }
    })
    .catch(err => error('Process watcher failed while checked for the process', err));
};

<<<<<<< HEAD
function recreateMainWindow(): void {
  createMainWindow(app, () => {
    createLogParser();
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
=======
export const connectionWaiter = (timeout: number) => {
  const adder = 1000;
  connWait.pingMtga(app.getVersion()).then(res => {
    if (res && logParser) {
      //console.log('COnnection Restored');
      if (timeout > 1000) {
        mainWindow.webContents.send('showprompt', { message: 'Connection established', autoclose: 1000 });
      }
      logParser.start();
    } else {
      mainWindow.webContents.send('show-status', {
        color: '#cc2d2d',
        message: 'Connection Error',
      });
      mainWindow.webContents.send('showprompt', { message: 'Awaiting connection!', autoclose: 0 });
      setTimeout(() => {
        connectionWaiter(timeout + adder);
      }, timeout);
    }
  });
};

export const createOverlay = () => {
  overlayWindow = new BrowserWindow({
    width: 300,
    height: 200,
    webPreferences: {
      nodeIntegration: true,
      devTools: isDev,
    },
    show: false,
    frame: false,
    hasShadow: false,
    title: 'MTGA Pro Tracker',
    resizable: false,
    transparent: true,
    alwaysOnTop: true,
    focusable: false,
  });

  overlayWindow.loadURL(OVERLAY_WINDOW_WEBPACK_ENTRY);
  overlayWindow.setMenuBarVisibility(false);
  overlayWindow.setIgnoreMouseEvents(true, { forward: true });
  overlayWindow.openDevTools();
};

const createWindow = () => {
  const appIcoImg = nativeImage.createFromPath(path.join(__dirname, AppIcon));
  const appIcon = new Tray(appIcoImg);
  const MenuLinks: MenuItemConstructorOptions[] = [];
  const MenuLabels: { [index: string]: string } = {
    'My Profile': 'https://mtgarena.pro/u/',
    Deckbuilder: 'https://mtgarena.pro/deckbuilder/',
    'Deck Converter': 'https://mtgarena.pro/converter/',
    Decks: 'https://mtgarena.pro/decks/?my',
    Collection: 'https://mtgarena.pro/collection/',
    Progress: 'https://mtgarena.pro/progress/',
    Events: 'https://mtgarena.pro/events/',
    Matches: 'https://mtgarena.pro/matches/',
    Rewards: 'https://mtgarena.pro/rewards/',
    Boosters: 'https://mtgarena.pro/boosters/',
  };

  Object.keys(MenuLabels).forEach(label => {
    MenuLinks.push({
      label,
      click: () => {
        shell.openExternal(MenuLabels[label]);
      },
    });
  });

  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Show Tracker',
      click: () => {
        mainWindow.show();
      },
    },
    { type: 'separator' },
    ...MenuLinks,
    { type: 'separator' },
    {
      label: 'Stop Tracker',
      click: () => {
        app.quit();
      },
    },
  ]);

  appIcon.setContextMenu(contextMenu);
  appIcon.on('double-click', () => {
    mainWindow.show();
    mainWindow.focus();
  });

  mainWindow = new BrowserWindow({
    width: 700,
    height: 500,
    webPreferences: {
      nodeIntegration: true,
      devTools: isDev,
    },
    show: false,
    frame: false,
    title: 'MTGA Pro Tracker',
    icon: path.join(__dirname, AppIcon),
    resizable: false,
  });

  mainWindow.loadURL(HOME_WINDOW_WEBPACK_ENTRY);
  mainWindow.setMenuBarVisibility(false);
  mainWindow.Tray = appIcon;

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    logParser = beginParsing();
    mainWindow.webContents.on('did-finish-load', () => {
      mainWindow.webContents.send('set-version', app.getVersion());
      setCreds('ready-to-show');
      setAccounts();
      if (!isDev) {
        UpdatesHunter();
      }
    });
    // tslint:disable-next-line: no-magic-numbers
    setInterval(intervalFunc, 250);
    if (store.get('minimized')) {
      mainWindow.minimize();
    }
>>>>>>> f50c09694b48994ce41d459833507ce3daa89ed2
  });
}

export const connWait: ConnectionWaiter = new ConnectionWaiter();
export const connectionWaiter = (timeout: number) => {
  connWait
    .pingMtga(app.getVersion())
    .then(res => {
      if (res) {
        //console.log('COnnection Restored');
        withLogParser(logParser => logParser.start());
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

<<<<<<< HEAD
=======
ipcMain.on('token-input', (_, arg) => {
  if (store.get('usertoken') !== arg.token) {
    store.set('usertoken', arg.token);
    store.set(arg.token, arg.uid, 'uid');
    store.set(arg.token, arg.token, 'token');
    store.set(arg.token, arg.nick, 'nick');
    store.set(arg.token, false, 'overlay');

    const awaiting = store.getsettings('awaiting');
    if (awaiting) {
      if (logParser) {
        logParser.setPlayerId(awaiting.playerId, awaiting.screenName);
      }
      store.set(arg.token, awaiting.playerId, 'playerId');
      store.set(arg.token, awaiting.screenName, 'screenName');
      store.set(arg.token, awaiting.language, 'language');
      setuserdata(awaiting.playerId, awaiting.screenName, awaiting.language, arg.token, app.getVersion());
      store.unset('awaiting', 'x', true);
    }
  }
});

ipcMain.on('minimize-me', () => {
  mainWindow.minimize();
});

ipcMain.on('apply-update', () => {
  autoUpdater.quitAndInstall();
});

ipcMain.on('set-setting', (_, arg) => {
  store.set(arg.setting, arg.data);
  switch (arg.setting) {
    case 'autorun':
      if (arg.data) {
        AutoLauncher.enable();
      } else {
        AutoLauncher.disable();
      }
      break;
    case 'icon':
      let Icon: any;
      switch (arg.data) {
        case '':
          Icon = require('root/statics/icon.ico');
          break;
        case '1':
          Icon = require('root/statics/icon1.ico');
          break;
        case '2':
          Icon = require('root/statics/icon2.ico');
          break;
        case '3':
          Icon = require('root/statics/icon3.ico');
          break;
        case '4':
          Icon = require('root/statics/icon4.ico');
          break;
      }
      const newico = nativeImage.createFromPath(path.join(__dirname, Icon));
      mainWindow.Tray.setImage(newico);
      mainWindow.setIcon(newico);
      break;
  }
  /*if (arg) {
    createOverlay();
  } else {
    overlayWindow.hide();
  }*/
});

ipcMain.on('kill-current-token', () => {
  const awaiting = store.getsettings(store.get('usertoken'));
  store.set('awaiting', awaiting.playerId, 'playerId');
  store.set('awaiting', awaiting.screenName, 'screenName');
  store.set('awaiting', awaiting.language, 'language');
  store.unset(store.get('usertoken'), 'x', true);
  store.unset('usertoken');
  if (logParser) {
    logParser.stop();
    mainWindow.webContents.send('new-account');
  }
  setAccounts();
});

ipcMain.on('set-log-path', (_, arg) => {
  dialog
    .showOpenDialog({
      properties: ['openFile'],
      filters: [{ name: 'output_*', extensions: ['txt'] }],
    })
    .then(log => {
      if (!log.canceled && log.filePaths[0]) {
        store.set('logpath', log.filePaths[0]);
        mainWindow.webContents.send('showprompt', { message: 'Log path have been updated!', autoclose: 1000 });
        if (logParser) {
          logParser.stop();
          logParser = beginParsing();
        }
        setAccounts();
      }
    });
});

ipcMain.on('default-log-path', (_, arg) => {
  store.unset('logpath');
  if (logParser) {
    mainWindow.webContents.send('showprompt', { message: 'Log path have been set to default!', autoclose: 1000 });
    logParser.stop();
    logParser = beginParsing();
  }
  setAccounts();
});

const ParseOldLogs = (logs: string[], index: number) => {
  mainWindow.webContents.send('showprompt', {
    message: `Parsing old log: ${index + 1}/${logs.length}`,
    autoclose: 0,
  });
  const parseOnce = beginParsing(logs[index], true);
  parseOnce.start();
  parseOnce.emitter.on('old-log-complete', () => {
    if (index + 1 === logs.length) {
      mainWindow.webContents.send('showprompt', { message: 'Parsing complete!', autoclose: 1000 });
    } else {
      ParseOldLogs(logs, index + 1);
    }
  });
};

ipcMain.on('old-log', (_, arg) => {
  dialog
    .showOpenDialog({
      properties: ['openFile', 'multiSelections'],
      defaultPath: 'C:\\Program Files (x86)\\Wizards of the Coast\\MTGA\\MTGA_Data\\Logs\\Logs',
      filters: [{ name: 'UTC_Log*', extensions: ['log'] }],
    })
    .then(log => {
      if (!log.canceled && log.filePaths.length > 0) {
        ParseOldLogs(log.filePaths, 0);
      }
    });
});

ipcMain.on('wipe-all', (_, arg) => {
  store.wipe();
  if (logParser) {
    mainWindow.webContents.send('showprompt', {
      message: 'All settings have been wiped',
      autoclose: 1000,
    });
    logParser.stop();
    logParser = beginParsing();
  }
  setAccounts();
});

ipcMain.on('check-updates', (_, arg) => {
  autoUpdater.checkForUpdates();
});

ipcMain.on('stop-tracker', (_, arg) => {
  app.quit();
});

>>>>>>> f50c09694b48994ce41d459833507ce3daa89ed2
if (store.get(store.get('usertoken'), 'autorun')) {
  enableAutoLauncher();
}

setupIpcMain(app);
