import {getMetadata, getUserMetadata} from 'root/api/overlay';
import {registerHotkeys, unRegisterHotkeys} from 'root/app/hotkeys';
import {WindowLocator} from 'root/app/locatewindow';
import {sendMessageToOverlayWindow, sendMessageToHomeWindow} from 'root/app/messages';
import {createOverlayWindow, getOverlayWindow} from 'root/app/overlay_window';
import {settingsStore} from 'root/app/settings-store/settings_store';
import {error} from 'root/lib/logger';
import {isMac} from 'root/lib/utils';
import psList from 'ps-list';

const movementSensitivity = 5;

const overlayPositioner = new WindowLocator();

let overlayIsPositioned = false;

class GameState {
  private startTimeMillis: number;
  private running: boolean;
  private overlayInterval: NodeJS.Timeout | undefined;
  private processId: number | undefined;

  private readonly refreshMillis = 500;
  private readonly processName = 'MTGA.exe';

  constructor() {
    this.startTimeMillis = Date.now();
    this.running = false;
    if (!isMac()) {
      setInterval(() => this.checkProcessId(), 500);
    }
  }

  public getStartTime(): number {
    return this.startTimeMillis;
  }

  public setRunning(running: boolean): void {
    if (!this.running && running) {
      this.running = true;
      this.startOverlay();
    } else if (this.running && !running) {
      this.running = running;
      this.stopOverlay();
      sendMessageToHomeWindow('show-status', {message: 'Game is not running!', color: '#dbb63d'});
    }
  }

  public getProcessId(): number {
    return this.processId ?? -1;
  }

  private startOverlay(): void {
    if (this.overlayInterval === undefined) {
      this.overlayInterval = setInterval(() => {
        const account = settingsStore.getAccount();

        if (account && settingsStore.get().overlay) {
          overlayPositioner.findMtga(account);
          const ovlSettings = account.overlaySettings;
          let overlayWindow = getOverlayWindow();

          if (!overlayWindow) {
            overlayWindow = createOverlayWindow();
            getMetadata()
              .then((md) => {
                //console.log(md.allcards);
                sendMessageToOverlayWindow('set-metadata', md);
                sendMessageToOverlayWindow('set-ovlsettings', ovlSettings);
                sendMessageToOverlayWindow('set-icosettings', settingsStore.get().icon);
              })
              .catch((err) => {
                error('Failure to load Metadata', err);
              });
            getUserMetadata(+account.uid)
              .then((umd) => sendMessageToOverlayWindow('set-userdata', umd))
              .catch((err) => {
                error('Failure to load User Metadata', err, {...account});
              });
          }

          if (
            overlayPositioner.bounds.width !== 0 &&
            (Math.abs(overlayWindow.getBounds().x - overlayPositioner.bounds.x) > movementSensitivity ||
              Math.abs(overlayWindow.getBounds().y - overlayPositioner.bounds.y) > movementSensitivity ||
              Math.abs(overlayWindow.getBounds().width - overlayPositioner.bounds.width) > movementSensitivity ||
              Math.abs(overlayWindow.getBounds().height - overlayPositioner.bounds.height) > movementSensitivity ||
              !overlayIsPositioned)
          ) {
            if (!overlayWindow.isVisible()) {
              registerHotkeys();
              if (isMac()) {
                overlayWindow.restore();
              } else {
                overlayWindow.show();
              }
            }
            const EtalonHeight = 1144;
            const zoomFactor = overlayPositioner.bounds.height / EtalonHeight;
            sendMessageToOverlayWindow('set-zoom', zoomFactor);
            overlayWindow.setBounds(overlayPositioner.bounds);
            overlayIsPositioned = true;
          } else if (
            (overlayPositioner.bounds.width === 0 && (!ovlSettings || !ovlSettings.neverhide)) ||
            !overlayIsPositioned
          ) {
            unRegisterHotkeys();
            overlayWindow.hide();
          } else {
            if (!overlayWindow.isVisible()) {
              registerHotkeys();
              if (isMac()) {
                overlayWindow.restore();
              } else {
                overlayWindow.show();
              }
            }
          }

          if (overlayWindow.isVisible()) {
            overlayWindow.setAlwaysOnTop(true, 'screen-saver');
          }
        }
      }, this.refreshMillis);
    }
  }

  private stopOverlay(): void {
    if (this.overlayInterval !== undefined) {
      clearInterval(this.overlayInterval);
      this.overlayInterval = undefined;
    }
  }

  private checkProcessId(): void {
    if (this.processId !== undefined) {
      try {
        process.kill(this.processId, 0);
      } catch {
        this.processId = undefined;
      }
    } else {
      psList()
        .then((processes) => {
          const res = processes.find((proc) => proc.name === this.processName);
          if (res !== undefined) {
            this.processId = res.pid;
            this.setRunning(true);
          }
        })
        .catch(() => {});
    }
  }
}

export const gameState = new GameState();
