// tslint:disable: no-any
import AutoLaunch from 'auto-launch';
import {
  app,
  autoUpdater,
  BrowserWindow,
  dialog,
  ipcMain,
  Menu,
  MenuItemConstructorOptions,
  nativeImage,
  shell,
  Tray,
} from 'electron';
import isDev from 'electron-is-dev';
import path from 'path';

import {setuserdata} from 'root/api/userbytokenid';
import {beginParsing} from 'root/lib/beginParsing';
import {ConnectionWaiter} from 'root/lib/connectionwaiter';
import {LogParser} from 'root/lib/logparser';
import {Store} from 'root/lib/storage';
import {ProcessWatcher} from 'root/lib/watchprocess';
import Icon from 'root/statics/icon.ico';
import Icon1 from 'root/statics/icon1.ico';
import Icon2 from 'root/statics/icon2.ico';
import Icon3 from 'root/statics/icon3.ico';
import Icon4 from 'root/statics/icon4.ico';

declare var HOME_WINDOW_WEBPACK_ENTRY: any;
declare var OVERLAY_WINDOW_WEBPACK_ENTRY: any;

const UpdateTimeout = 600000;

const UpdatesHunter = () => {
  //autoUpdater.checkForUpdates();
  setTimeout(UpdatesHunter, UpdateTimeout);
};

if (!isDev) {
  const server = 'https://update.electronjs.org';
  const feed = `${server}/Razviar/mtgap/${process.platform}-${process.arch}/${app.getVersion()}`;

  autoUpdater.setFeedURL({url: feed});
  autoUpdater.on('update-not-available', () => {
    mainWindow.webContents.send('showprompt', {message: 'You have latest version!', autoclose: 1000});
  });
  autoUpdater.on('error', () => {
    mainWindow.webContents.send('showprompt', {message: 'Error while checking updates!', autoclose: 1000});
  });
  autoUpdater.on('checking-for-update', () => {
    mainWindow.webContents.send('showprompt', {message: 'Checking updates...', autoclose: 0});
  });
  autoUpdater.on('update-available', () => {
    mainWindow.webContents.send('showprompt', {message: 'Downloading update...', autoclose: 0});
  });
  autoUpdater.on('update-downloaded', () => {
    mainWindow.webContents.send('showprompt', {message: 'Download complete. Restarting app...', autoclose: 0});
    autoUpdater.quitAndInstall();
  });

  UpdatesHunter();
}

const AutoLauncher = new AutoLaunch({
  name: 'mtgaprotracker',
});

// tslint:disable-next-line: no-var-requires
if (require('electron-squirrel-startup')) {
  app.quit();
}

export const store = new Store({
  configName: 'user-preferences',
  defaults: {},
});

export let mainWindow: any;
export let overlayWindow: any;
export let logParser: LogParser | undefined;
export let MTGApid = -1;
export const processWatcher: ProcessWatcher = new ProcessWatcher('MTGA.exe');
export const connWait: ConnectionWaiter = new ConnectionWaiter();

export const setCreds = (source: string) => {
  //console.log('setCreds:' + source);
  const token = store.get('usertoken');
  if (token) {
    const uid = store.get(token, 'uid');
    const nick = store.get(token, 'nick');
    if (uid && nick) {
      mainWindow.webContents.send('set-creds', {token, uid, nick, source});
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
  };
  mainWindow.webContents.send('set-settings', settings);
};

const intervalFunc = () => {
  if (processWatcher) {
    processWatcher.getprocesses().then(res => {
      MTGApid = res;
      if (res === -1 && connWait.status) {
        mainWindow.webContents.send('show-status', {
          color: '#dbb63d',
          message: 'Game is not running!',
        });
      }
    });
  }
};

export const connectionWaiter = (timeout: number) => {
  connWait.pingMtga(app.getVersion()).then(res => {
    if (res && logParser) {
      //console.log('COnnection Restored');
      logParser.start();
    } else {
      mainWindow.webContents.send('show-status', {
        color: '#cc2d2d',
        message: 'Connection Error',
      });
      setTimeout(() => {
        connectionWaiter(timeout + 1000);
      }, 1000);
    }
  });
};

export const createOverlay = () => {
  overlayWindow = new BrowserWindow({
    width: 400,
    height: 500,
    webPreferences: {
      nodeIntegration: true,
      devTools: isDev,
    },
    show: false,
    frame: false,
    title: 'MTGA Pro Tracker',
    resizable: false,
    transparent: true,
    alwaysOnTop: true,
  });

  overlayWindow.loadURL(OVERLAY_WINDOW_WEBPACK_ENTRY);
  overlayWindow.setMenuBarVisibility(false);

  overlayWindow.once('ready-to-show', () => {
    overlayWindow.show();
  });
};

const createWindow = () => {
  const appIcoImg = nativeImage.createFromPath(path.join(__dirname, Icon));
  const appIcon = new Tray(appIcoImg);
  const MenuLinks: MenuItemConstructorOptions[] = [];
  const MenuLabels: {[index: string]: string} = {
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
    {type: 'separator'},
    ...MenuLinks,
    {type: 'separator'},
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
    icon: appIcoImg,
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
    });
    setInterval(intervalFunc, 1000);
    if (store.get(store.get('usertoken'), 'minimized')) {
      mainWindow.minimize();
    }
  });

  mainWindow.on('minimize', function(event: any) {
    event.preventDefault();
    mainWindow.hide();
  });
};

const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) {
        mainWindow.restore();
      }
      mainWindow.focus();
    }
  });

  app.on('ready', createWindow);

  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
      app.quit();
    }
  });

  app.on('activate', () => {
    if (mainWindow === null) {
      createWindow();
    }
  });
}

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
      setuserdata(
        {mtgaId: awaiting.playerId, mtgaNick: awaiting.screenName, language: awaiting.language, token: arg.token},
        app.getVersion()
      );
      store.unset('awaiting', 'x', true);
    }
  }
});

ipcMain.on('minimize-me', () => {
  mainWindow.minimize();
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
  dialog.showOpenDialog({properties: ['openFile']}).then(log => {
    if (!log.canceled && log.filePaths[0]) {
      store.set('logpath', log.filePaths[0]);
      mainWindow.webContents.send('showprompt', {message: 'Log path have been updated!', autoclose: 1000});
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
    mainWindow.webContents.send('showprompt', {message: 'Log path have been set to default!', autoclose: 1000});
    logParser.stop();
    logParser = beginParsing();
  }
  setAccounts();
});

ipcMain.on('old-log', (_, arg) => {
  dialog
    .showOpenDialog({
      properties: ['openFile'],
      defaultPath: 'C:\\Program Files (x86)\\Wizards of the Coast\\MTGA\\MTGA_Data\\Logs\\Logs',
      filters: [{name: 'UTC_Log*', extensions: ['log']}],
    })
    .then(log => {
      if (!log.canceled && log.filePaths[0]) {
        mainWindow.webContents.send('showprompt', {message: 'Parsing old log...', autoclose: 0});
        if (logParser) {
          const parseOnce = beginParsing(log.filePaths[0], true);
          parseOnce.start();
          parseOnce.emitter.on('old-log-complete', () => {
            mainWindow.webContents.send('showprompt', {message: 'Parsing complete!', autoclose: 0});
          });
        }
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

if (store.get(store.get('usertoken'), 'autorun')) {
  AutoLauncher.enable();
}
