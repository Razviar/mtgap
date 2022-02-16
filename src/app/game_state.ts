import {exec, execFile} from 'child_process';
import {BrowserWindow} from 'electron';
import electronIsDev from 'electron-is-dev';
import {join} from 'path';
import psList from 'ps-list';

import {getMetadata, getUserMetadata} from 'root/api/overlay';
import {registerHotkeys, unRegisterHotkeys} from 'root/app/hotkeys';
import {WindowLocator} from 'root/app/locatewindow';
import {withLogParser} from 'root/app/log_parser_manager';
import {sendMessageToHomeWindow, sendMessageToOverlayWindow} from 'root/app/messages';
import {createOverlayWindow, getOverlayWindow} from 'root/app/overlay_window';
import {settingsStore} from 'root/app/settings-store/settings_store';
import {error} from 'root/lib/logger';
import {hasOwnProperty} from 'root/lib/type_utils';
import {isMac, sleep} from 'root/lib/utils';
import ourActiveWin from 'root/our-active-win';

const HALF_SECOND = 500;
const TWO_SECONDS = 2000;

class GameState {
  private readonly startTimeMillis: number;
  private running: boolean;
  private AVBlocked: boolean;
  private overlayInterval: NodeJS.Timeout | undefined;
  private psListInterval: NodeJS.Timeout | undefined;
  private processId: number | undefined;
  private badErrorHappening: boolean = false;
  private refreshMillis = 500;
  private readonly processName = isMac() ? 'MTGA.app/Contents/MacOS/MTGA' : 'MTGA.exe';
  private readonly movementSensitivity = 1;
  private readonly overlayPositioner = new WindowLocator();
  private overlayIsPositioned = false;
  public isFullscreen: boolean = false;

  constructor() {
    this.startTimeMillis = Date.now();
    this.running = false;
    this.AVBlocked = false;
    this.checkProcessId();
  }

  public setRefreshRate(refreshRate: number): void {
    this.refreshMillis = refreshRate;
    if (this.overlayInterval !== undefined) {
      clearInterval(this.overlayInterval);
      this.overlayInterval = undefined;
    }
    this.startOverlay();
  }

  public getStartTime(): number {
    return this.startTimeMillis;
  }

  public setAVBlocked() {
    this.AVBlocked = true;
  }

  public getAVBlocked() {
    return this.AVBlocked;
  }

  public setRunning(running: boolean): void {
    //console.log('setRunning', running, this.running, this.badErrorHappening);
    if (!this.running && running) {
      this.running = true;
      this.startOverlay();
      this.psListInterval = setInterval(() => this.checkProcessId(), this.refreshMillis);
      withLogParser((logParser) => {
        logParser.changeParserFreq(undefined).catch((err) => {
          error('Failure to start log parser', err);
        });
      });
    } else if (this.running && !running) {
      this.running = running;
      this.stopOverlay();
      if (this.psListInterval) {
        clearInterval(this.psListInterval);
        this.psListInterval = undefined;
      }
      withLogParser((logParser) => {
        logParser.changeParserFreq(TWO_SECONDS).catch((err) => {
          error('Failure to start log parser', err);
        });
      });
      if (this.badErrorHappening) {
        //console.log('switching off bad error mode');
        this.processId = undefined;
        this.badErrorHappening = false;
      }
      sendMessageToHomeWindow('show-status', {message: 'Game is not running!', color: '#dbb63d'});
    }
  }

  public getProcessId(): number {
    return this.processId ?? -1;
  }

  private showOverlay(overlayWindow: BrowserWindow): void {
    /*if (electronIsDev) {
      console.log('Showing Overlay');
    }*/
    if (!overlayWindow.isVisible()) {
      registerHotkeys();
      if (isMac()) {
        overlayWindow.showInactive();
      } else {
        setTimeout(overlayWindow.show.bind(overlayWindow), HALF_SECOND - 100);
      }
    }
  }

  private hideOverlay(overlayWindow: BrowserWindow): void {
    unRegisterHotkeys();
    overlayWindow.hide();
  }

  public overlayPositionSetter(onlySetPosition?: boolean): void {
    const account = settingsStore.getAccount();
    /*if (electronIsDev) {
      console.log('Doing positioning!');
    }*/
    if (account && settingsStore.get().overlay) {
      if (!onlySetPosition) {
        this.overlayPositioner.findMtga(account, !isMac());

        if (this.isFullscreen !== this.overlayPositioner.isFullscreen) {
          this.isFullscreen = this.overlayPositioner.isFullscreen;
          if (this.isFullscreen) {
            if (this.refreshMillis !== TWO_SECONDS) {
              this.setRefreshRate(TWO_SECONDS);
            }
          } else {
            if (this.refreshMillis !== HALF_SECOND) {
              this.setRefreshRate(HALF_SECOND);
            }
          }
        }
      }
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
      /*if (electronIsDev) {
        console.log('Got new bounds', this.overlayPositioner.bounds);
      }*/
      if (isMac()) {
        if (!overlayWindow.isFocused()) {
          overlayWindow.focus();
        }
      }
      if (
        this.overlayPositioner.bounds.width !== 0 &&
        (Math.abs(overlayWindow.getBounds().x - this.overlayPositioner.bounds.x) > this.movementSensitivity ||
          Math.abs(overlayWindow.getBounds().y - this.overlayPositioner.bounds.y) > this.movementSensitivity ||
          Math.abs(overlayWindow.getBounds().width - this.overlayPositioner.bounds.width) > this.movementSensitivity ||
          Math.abs(overlayWindow.getBounds().height - this.overlayPositioner.bounds.height) >
            this.movementSensitivity ||
          !this.overlayIsPositioned)
      ) {
        this.showOverlay(overlayWindow);
        const EtalonHeight = 1144;
        const zoomFactor = this.overlayPositioner.bounds.height / EtalonHeight;
        sendMessageToOverlayWindow('set-zoom', zoomFactor);
        try {
          overlayWindow.setBounds(this.overlayPositioner.bounds);
          this.overlayIsPositioned = true;
        } catch (err) {
          error("couldn't set overlay bounds, hiding overlay for now", err);
          this.hideOverlay(overlayWindow);
        }
      } else if (
        (this.overlayPositioner.bounds.width === 0 && (!ovlSettings || !ovlSettings.neverhide)) ||
        !this.overlayIsPositioned
      ) {
        if (isMac()) {
          if (!overlayWindow.isFocused()) {
            this.hideOverlay(overlayWindow);
          }
        } else {
          this.hideOverlay(overlayWindow);
        }
      } else {
        this.showOverlay(overlayWindow);
      }
    } else {
      if (!isMac()) {
        ourActiveWin.launch(true);
      }
    }
  }

  private startOverlay(): void {
    if (!isMac()) {
      //console.log('Starting Overlay new way!');
      this.overlayPositionSetter(false);
    } else if (this.overlayInterval === undefined) {
      this.overlayInterval = setInterval(() => {
        this.overlayPositionSetter(false);
      }, this.refreshMillis);
    }
  }

  private stopOverlay(): void {
    if (this.overlayInterval !== undefined) {
      clearInterval(this.overlayInterval);
      this.overlayInterval = undefined;
    }
    const overlayWindow = getOverlayWindow();
    if (overlayWindow) {
      overlayWindow.hide();
    }
  }

  public checkProcessId(): void {
    if (this.processId !== undefined && !this.badErrorHappening) {
      try {
        //console.log('trying to kill', this.processId);
        process.kill(this.processId, 0);
      } catch (e: unknown) {
        if (e instanceof Object && hasOwnProperty(e, 'code') && e.code === 'ESRCH') {
          //console.log('got good error');
          this.processId = undefined;
          this.badErrorHappening = false;
          this.setRunning(false);
        } else {
          this.badErrorHappening = true;
          //console.log('got bad error');
        }
      }
    } else {
      if (electronIsDev) {
        //console.log('pinging psList');
      }
      psList()
        .then((processes) => {
          const res = processes.find((proc) =>
            isMac() ? proc.cmd?.includes(this.processName) : proc.name === this.processName
          );
          if (res !== undefined) {
            //console.log('found MTGA');
            if (!this.badErrorHappening) {
              //console.log('setting PID');
              this.processId = res.pid;
            }
            this.setRunning(true);
          } else {
            //console.log('not found MTGA');
            if (this.badErrorHappening) {
              //console.log('not found MTGA, doing what needs to be done');
              this.processId = undefined;
              this.setRunning(false);
            }
          }
        })
        .catch(() => {});
    }

    if (this.overlayPositioner.SpawnedProcess && !this.running) {
      this.overlayPositioner.killSpawnedProcess();
    }
  }

  public async doMTGARestart(): Promise<void> {
    try {
      const mtgaPath = settingsStore.get().mtgaPath;
      if (this.processId !== undefined && mtgaPath !== undefined) {
        exec(`wmic process where "ProcessID=${this.processId}" delete`).unref();
        this.setRunning(false);
        await sleep(1000);
        execFile(join(mtgaPath, '..', 'MTGA.exe')).unref();
        await sleep(1000);
        this.checkProcessId();
      }
    } catch (e) {
      // tslint:disable-next-line: no-console
      console.log(e);
    }
  }
}

export const gameState = new GameState();
