import {ChildProcessWithoutNullStreams} from 'child_process';
import {screen} from 'electron';

import {gameState} from 'root/app/game_state';
import {sendMessageToOverlayWindow} from 'root/app/messages';
import {AccountV8} from 'root/app/settings-store/v9';
import {isMac} from 'root/lib/utils';
import ourActiveWin from 'root/our-active-win';

export class WindowLocator {
  public bounds: {x: number; y: number; width: number; height: number} = {x: 0, y: 0, width: 0, height: 0};
  public isFullscreen: boolean = false;
  public SpawnedProcess: ChildProcessWithoutNullStreams | undefined;

  private countBindings(processes: ourActiveWin.Result): void {
    const display = screen.getPrimaryDisplay();
    const xMargin = 6;
    const yMargin = 30;
    if (
      processes.bounds.y === 0 &&
      processes.bounds.width === display.bounds.width &&
      processes.bounds.height === display.bounds.height
    ) {
      //console.log('FullScreen!');
      this.isFullscreen = true;
      const monitorNumber = processes.bounds.x / processes.bounds.width;
      this.bounds = {
        x: monitorNumber * display.bounds.width,
        y: 0,
        width: display.bounds.width,
        height: display.bounds.height,
      };
    } else {
      this.isFullscreen = false;
      this.bounds = {
        x: processes.bounds.x + xMargin,
        y: processes.bounds.y + yMargin,
        width: processes.bounds.width,
        height: processes.bounds.height,
      };
      //console.log(this.bounds);
    }
    gameState.overlayPositionSetter(true);
    //console.log(display);
    //console.log(processes.bounds);
  }

  private isMtgaWindow(process: ourActiveWin.Result): boolean {
    return process.title === 'MTGA' && gameState.getProcessId() === process.owner.processId;
  }

  private handleProcessRead(process: ourActiveWin.Result | undefined): void {
    if (process && this.isMtgaWindow(process)) {
      this.countBindings(process);
      sendMessageToOverlayWindow('need-to-restart-mtga', process.admin);
    } else {
      this.bounds = {
        x: 0,
        y: 0,
        width: 0,
        height: 0,
      };
      gameState.overlayPositionSetter(true);
      //console.log(this.bounds);
    }
  }

  public ProcessData(stdout: unknown): void {
    try {
      const raw = String(stdout);
      //console.log(raw);
      raw.split('\n').map((line: string) => {
        if (line.indexOf('{') !== -1 && line.indexOf('}') !== -1) {
          const process = JSON.parse(line) as ourActiveWin.Result;
          this.handleProcessRead(process);
        }
      });
    } catch (error) {
      /*console.log(stdout.toString());
      console.error(error);*/
      //throw new Error('Error parsing window data');
    }
  }

  public killSpawnedProcess(): void {
    if (this.SpawnedProcess) {
      this.SpawnedProcess.kill();
    }
  }

  public findMtga(account: AccountV8, hook?: boolean): void {
    /*const path = join(app.getPath('userData'), 'debugging.txt');
    fs.appendFileSync(path, JSON.stringify({pid}));*/
    //console.log('findmtga');
    try {
      if (account.overlaySettings !== undefined && account.overlaySettings.detach) {
        const displays = screen.getAllDisplays();
        let width = 0;
        let height = 0;
        displays.forEach((display) => {
          if (display.bounds.height > height) {
            height = display.bounds.height;
          }
          width += display.bounds.width;
        });
        this.bounds = {
          x: 0,
          y: 0,
          width,
          height,
        };
        //console.log(this.bounds);
      } else if (hook && !isMac()) {
        this.SpawnedProcess = ourActiveWin.launch();
        if (this.SpawnedProcess) {
          this.SpawnedProcess.stdout.on('data', this.ProcessData.bind(this));
        }
      } else {
        const process = ourActiveWin.sync();
        this.handleProcessRead(process);
      }
    } catch (e) {
      // error('findMtga', e);
      // console.log(e);
      //fs.appendFileSync(path, e);
    }
  }
}
