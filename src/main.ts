// tslint:disable: no-any
import { app, BrowserWindow, ipcMain, Tray, Menu, nativeImage, MenuItemConstructorOptions, shell } from 'electron';
import { Store } from './lib/storage';
import { beginParsing } from './lib/beginParsing';
import { LogParser } from './lib/logparser';
import { ProcessWatcher } from './lib/watchprocess';
import Icon from 'root/statics/icon.ico';
import path from 'path';
import { setuserdata } from './api/userbytokenid';
import { ConnectionWaiter } from './lib/connectionwaiter';

declare var HOME_WINDOW_WEBPACK_ENTRY: any;
declare var OVERLAY_WINDOW_WEBPACK_ENTRY: any;

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

export const setCreds = () => {
  const token = store.get('usertoken');
  if (token) {
    const screenName = store.get(token, 'screenName');
    const nick = store.get(token, 'nick');
    if (screenName && nick) {
      mainWindow.webContents.send('hide-token');
      mainWindow.webContents.send('set-creds', { screenName, nick });
    }
  }
};

const setAccounts = () => {
  const accounts = store.get('settings');
  //console.log(accounts);
  if (accounts) {
    mainWindow.webContents.send('set-accounts', accounts);
  }
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

export const connectionWaiter = () => {
  connWait.pingMtga().then(res => {
    if (res && logParser) {
      //console.log('COnnection Restored');
      logParser.start();
    } else {
      mainWindow.webContents.send('show-status', {
        color: '#cc2d2d',
        message: 'Connection Error',
      });
      setTimeout(connectionWaiter, 1000);
    }
  });
};

export const createOverlay = () => {
  overlayWindow = new BrowserWindow({
    width: 400,
    height: 500,
    webPreferences: {
      nodeIntegration: true,
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
      setCreds();
      setAccounts();
    });
    setInterval(intervalFunc, 1000);
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
      setuserdata(awaiting.playerId, awaiting.screenName, awaiting.language, arg.token);
      store.unset('awaiting', 'x', true);
    }
  }
});

ipcMain.on('minimize-me', () => {
  mainWindow.minimize();
});

ipcMain.on('set-overlay', (_, arg) => {
  store.set(store.get('usertoken'), arg, 'overlay');
  if (arg) {
    createOverlay();
  } else {
    overlayWindow.hide();
  }
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
});
