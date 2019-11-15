// tslint:disable: no-any
import { app, BrowserWindow, ipcMain, Tray, Menu, nativeImage } from 'electron';
import { Store } from './lib/storage';
import { beginParsing } from './lib/beginParsing';
import { LogParser } from './lib/logparser';
import { ProcessWatcher } from './lib/watchprocess';
import Icon from 'root/statics/icon0.ico';
import path from 'path';

declare var HOME_WINDOW_WEBPACK_ENTRY: any;

// tslint:disable-next-line: no-var-requires
if (require('electron-squirrel-startup')) {
  app.quit();
}

export const store = new Store({
  configName: 'user-preferences',
  defaults: {},
});

export let mainWindow: any;
export let logParser: LogParser | undefined;
export let MTGApid = -1;
export const processWatcher: ProcessWatcher = new ProcessWatcher('MTGA.exe');

export const setCreds = () => {
  const token = store.get('usertoken');
  if (token) {
    mainWindow.webContents.send('set-token', token);
    const screenName = store.get(token, 'screenName');
    if (screenName) {
      mainWindow.webContents.send('set-creds', screenName);
    }
  }
};

const setAccounts = () => {
  const accounts = store.get('settings');
  if (accounts) {
    mainWindow.webContents.send('set-accounts', accounts);
  }
};

const intervalFunc = () => {
  if (processWatcher) {
    processWatcher.getprocesses().then(res => {
      MTGApid = res;
      if (res === -1) {
        mainWindow.webContents.send('show-status', {
          color: '#dbb63d',
          message: 'Game is not running!',
        });
      }
    });
  }
};

const createWindow = () => {
  const appIcoImg = nativeImage.createFromPath(path.join(__dirname, Icon));
  const appIcon = new Tray(appIcoImg);
  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Show App',
      click: () => {
        mainWindow.show();
      },
    },
    {
      label: 'Quit',
      click: () => {
        app.quit();
      },
    },
  ]);

  appIcon.setContextMenu(contextMenu);
  appIcon.on('double-click', () => {
    if (mainWindow.isMinimized()) {
      mainWindow.restore();
    }
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
  mainWindow.webContents.openDevTools();
  mainWindow.setMenuBarVisibility(false);
  mainWindow.Tray = appIcon;

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    mainWindow.webContents.send('set-version', app.getVersion());
    setCreds();
    setAccounts();
    logParser = beginParsing();
    const t = setInterval(intervalFunc, 1000);
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
  app.on('second-instance', (event, commandLine, workingDirectory) => {
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
      store.unset('awaiting', 'x', true);
    }
  }
});

ipcMain.on('minimize-me', (_, arg) => {
  mainWindow.minimize();
});

ipcMain.on('set-overlay', (_, arg) => {
  store.set(store.get('usertoken'), arg, 'overlay');
});
