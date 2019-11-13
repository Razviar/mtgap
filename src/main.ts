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
        //app.isQuiting = true;
        app.quit();
      },
    },
  ]);

  appIcon.setContextMenu(contextMenu);

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

  mainWindow.on('minimize', function(event: any) {
    event.preventDefault();
    mainWindow.hide();
  });

  /*mainWindow.on('close', function(event: any) {
    if (!app.isQuiting) {
      event.preventDefault();
      mainWindow.hide();
    }

    return false;
  });*/
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
    logParser = beginParsing();
  }
});

ipcMain.on('minimize-me', (_, arg) => {
  mainWindow.minimize();
});

if (store.get('usertoken')) {
  logParser = beginParsing();
  const t = setInterval(intervalFunc, 1000);
  //this.intervalFunc();
}
