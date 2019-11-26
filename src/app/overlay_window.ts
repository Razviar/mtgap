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

export function createOverlayWindow(): void {
  overlayWindow = new BrowserWindow({
    width: 400,
    height: 500,
    webPreferences: {
      nodeIntegration: true,
      devTools: electronIsDev,
    },
    show: false,
    frame: false,
    title: 'MTGA Pro Tracker',
    resizable: false,
    transparent: true,
    alwaysOnTop: true,
  });

  overlayWindow.loadURL(OVERLAY_WINDOW_WEBPACK_ENTRY).catch(err =>
    error('Failure to load url in overlay window', err, {
      entry: HOME_WINDOW_WEBPACK_ENTRY,
    })
  );
  overlayWindow.setMenuBarVisibility(false);
  overlayWindow.once('ready-to-show', () => withOverlayWindow(w => w.show()));
}
