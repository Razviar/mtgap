import {BrowserWindow, nativeImage, Tray} from 'electron';
import electronIsDev from 'electron-is-dev';
import {join} from 'path';

import {getAppIcon} from 'root/app/app_icon';
import {createContextMenuForMainWindow} from 'root/app/context_menu';
import {error} from 'root/lib/logger';

export type MaybeBrowserWindow = BrowserWindow | undefined;
let mainWindow: MaybeBrowserWindow;

export function getMainWindow(): BrowserWindow | undefined {
  return mainWindow;
}

export function withHomeWindow(fn: (mainWindow: BrowserWindow) => void): void {
  if (mainWindow === undefined) {
    return;
  }
  fn(mainWindow);
}

export function createMainWindow(): void {
  const appIcoImg = nativeImage.createFromPath(join(__dirname, getAppIcon()));
  const appIcon = new Tray(appIcoImg);

  mainWindow = new BrowserWindow({
    width: 700,
    height: 500,
    maxWidth: 700,
    maxHeight: 500,
    minWidth: 700,
    minHeight: 500,
    webPreferences: {
      devTools: electronIsDev,
      allowRunningInsecureContent: false,
      contextIsolation: true,
      nodeIntegration: false,
      nodeIntegrationInSubFrames: false,
      nodeIntegrationInWorker: false,
      sandbox: true,
      webSecurity: true,
      preload: HOME_WINDOW_PRELOAD_WEBPACK_ENTRY,
      zoomFactor: 1.0,
    },
    show: false,
    frame: false,
    title: 'MTGA Pro Tracker',
    icon: appIcoImg,
    resizable: true,
  });
  mainWindow.Tray = appIcon;

  appIcon.setContextMenu(createContextMenuForMainWindow(mainWindow));
  appIcon.on('double-click', () => {
    withHomeWindow((w) => w.show());
    withHomeWindow((w) => w.focus());
  });

  mainWindow.setMenuBarVisibility(false);

  mainWindow.on('closed', () => {
    mainWindow = undefined;
  });

  mainWindow.on('minimize', (event: Electron.Event) => {
    event.preventDefault();
    withHomeWindow((w) => w.hide());
  });

  mainWindow.loadURL(HOME_WINDOW_WEBPACK_ENTRY).catch((err) =>
    error('Failure to load url in main window', err, {
      entry: HOME_WINDOW_WEBPACK_ENTRY,
    })
  );
  mainWindow.webContents.openDevTools({mode: 'detach'});
}
