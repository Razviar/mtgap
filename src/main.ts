// tslint:disable: no-any
import { app, BrowserWindow, ipcMain } from 'electron';
import { Store } from './lib/storage';
import { beginParsing } from './lib/beginParsing';
import { LogParser } from './lib/logparser';
import { ProcessWatcher } from './lib/watchprocess';

declare var MAIN_WINDOW_WEBPACK_ENTRY: any;

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

const setCreds = () => {
  const token = store.get('usertoken');
  if (token) {
    mainWindow.webContents.send('set-token', token);
    const screenName = store.get(token, 'screenName');
    if (screenName) {
      mainWindow.webContents.send('set-creds', screenName);
    }
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
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: true,
    },
    show: false,
    frame: false,
  });

  mainWindow.loadURL(MAIN_WINDOW_WEBPACK_ENTRY);
  mainWindow.webContents.openDevTools();
  mainWindow.setMenuBarVisibility(false);

  // Emitted when the window is closed.
  mainWindow.on('closed', () => {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    mainWindow = null;
  });

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    mainWindow.webContents.send('set-version', app.getVersion());
    setCreds();
  });
};

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow);

// Quit when all windows are closed.
app.on('window-all-closed', () => {
  // On OS X it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (mainWindow === null) {
    createWindow();
  }
});

ipcMain.on('token-input', (_, arg) => {
  if (!store.get('usertoken') || store.get('usertoken') !== arg.token) {
    store.set('usertoken', arg.token);
    store.set(arg.token, arg.uid, 'uid');
    store.set(arg.token, arg.token, 'token');
    logParser = beginParsing(arg.token);
  }
});

if (store.get('usertoken')) {
  logParser = beginParsing(store.get('usertoken'));
  const t = setInterval(intervalFunc, 1000);
  //this.intervalFunc();
}
