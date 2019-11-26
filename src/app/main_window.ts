import {App, BrowserWindow, nativeImage, Tray} from 'electron';
import electronIsDev from 'electron-is-dev';
import path from 'path';

import {createContextMenuForMainWindow} from 'root/app/context_menu';
import {error} from 'root/lib/logger';
import {asString} from 'root/lib/type_utils';
import Icon from 'root/statics/icon.ico';

export type MaybeBrowserWindow = BrowserWindow | undefined;
let mainWindow: MaybeBrowserWindow;

export function getMainWindow(): BrowserWindow | undefined {
  return mainWindow;
}

export function withMainWindow(fn: (mainWindow: BrowserWindow) => void): void {
  if (mainWindow === undefined) {
    return;
  }
  fn(mainWindow);
}

export function createMainWindow(app: App, onceReadyToShow: (mainWindow: BrowserWindow) => void): void {
  const appIcoImg = nativeImage.createFromPath(path.join(__dirname, asString(Icon, '')));
  const appIcon = new Tray(appIcoImg);

  mainWindow = new BrowserWindow({
    width: 700,
    height: 500,
    webPreferences: {
      nodeIntegration: true,
      devTools: electronIsDev,
    },
    show: false,
    frame: false,
    title: 'MTGA Pro Tracker',
    icon: appIcoImg,
    resizable: false,
  });
  mainWindow.Tray = appIcon;

  appIcon.setContextMenu(createContextMenuForMainWindow(app, mainWindow));
  appIcon.on('double-click', () => {
    withMainWindow(w => w.show());
    withMainWindow(w => w.focus());
  });

  mainWindow.loadURL(HOME_WINDOW_WEBPACK_ENTRY).catch(err =>
    error('Failure to load url in main window', err, {
      entry: HOME_WINDOW_WEBPACK_ENTRY,
    })
  );
  mainWindow.setMenuBarVisibility(false);

  mainWindow.on('closed', () => {
    mainWindow = undefined;
  });

  mainWindow.once('ready-to-show', onceReadyToShow);

  mainWindow.on('minimize', function(event: any) {
    event.preventDefault();
    withMainWindow(w => w.hide());
  });
}
