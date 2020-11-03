import {BrowserWindow} from 'electron';
import electronIsDev from 'electron-is-dev';

import {error} from 'root/lib/logger';

export type MaybeBrowserWindow = BrowserWindow | undefined;
let overlayWindow: MaybeBrowserWindow;

export function getOverlayWindow(): BrowserWindow | undefined {
  return overlayWindow;
}

export function withOverlayWindow(fn: (overlayWindow: BrowserWindow) => void): void {
  if (overlayWindow === undefined) {
    return;
  }
  fn(overlayWindow);
}

export function createOverlayWindow(): BrowserWindow {
  overlayWindow = new BrowserWindow({
    width: 300,
    height: 200,
    webPreferences: {
      devTools: electronIsDev,
      allowRunningInsecureContent: false,
      contextIsolation: true,
      enableRemoteModule: false,
      nodeIntegration: false,
      nodeIntegrationInSubFrames: false,
      nodeIntegrationInWorker: false,
      sandbox: true,
      webSecurity: true,
      preload: OVERLAY_WINDOW_PRELOAD_WEBPACK_ENTRY,
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

  overlayWindow.loadURL(OVERLAY_WINDOW_WEBPACK_ENTRY).catch((err) =>
    error('Failure to load url in overlay window', err, {
      entry: OVERLAY_WINDOW_WEBPACK_ENTRY,
    })
  );
  overlayWindow.setMenuBarVisibility(false);
  overlayWindow.webContents.openDevTools({mode: 'detach'});
  overlayWindow.setIgnoreMouseEvents(true, {forward: true});
  overlayWindow.setVisibleOnAllWorkspaces(true, {visibleOnFullScreen: true});
  overlayWindow.setAlwaysOnTop(true, 'screen-saver');
  return overlayWindow;
}
