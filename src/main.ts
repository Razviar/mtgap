// tslint:disable: no-any
import { app, BrowserWindow, ipcMain } from 'electron';
import { Store } from './lib/storage';
import { LogParser } from './lib/logparser';
import { uploadpackfile } from './api/logsender';
import { ParseResults } from './models/indicators';
declare var MAIN_WINDOW_WEBPACK_ENTRY: any;

// tslint:disable-next-line: no-var-requires
if (require('electron-squirrel-startup')) {
  app.quit();
}

const store = new Store({
  configName: 'user-preferences',
  defaults: {},
});

let mainWindow: any;

const createWindow = () => {
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: true,
    },
    show: false,
  });

  mainWindow.loadURL(MAIN_WINDOW_WEBPACK_ENTRY);
  mainWindow.webContents.openDevTools();

  // Emitted when the window is closed.
  mainWindow.on('closed', () => {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    mainWindow = null;
  });

  mainWindow.once('ready-to-show', () => {
    if (store.get('usertoken')) {
      mainWindow.webContents.send('set-token', store.get('usertoken'));
    }
    mainWindow.show();
  });
};

const beginParsing = (usertoken: string) => {
  const logParser = new LogParser([
    'LocalLow',
    'Wizards Of The Coast',
    'MTGA',
    'output_log.txt',
  ]);

  logParser.emitter.on('newdata', data => {
    const datasending: ParseResults[] = data as ParseResults[];
    //console.log(datasending);
    if (datasending.length > 0) {
      uploadpackfile(datasending, +store.get('userid'), usertoken);
    }
  });

  const emitting = ['playerId', 'screenName', 'language'];
  emitting.forEach(em => {
    logParser.emitter.on(em, data => {
      store.set(usertoken, data, em);
    });
  });

  logParser.start();
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
  store.set('usertoken', arg.token);
  store.set(arg.token, arg.uid, 'uid');
  store.set(arg.token, arg.token, 'token');
  beginParsing(arg.token);
});

if (store.get('usertoken')) {
  beginParsing(store.get('usertoken'));
}
