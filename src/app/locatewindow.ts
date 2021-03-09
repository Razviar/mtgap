import {screen} from 'electron';

import {gameState} from 'root/app/game_state';
import {AccountV8} from 'root/app/settings-store/v9';
import {isMac} from 'root/lib/utils';
import {getOverlayWindow} from 'root/app/overlay_window';
import ourActiveWin from 'root/our-active-win';

export class WindowLocator {
  public bounds: {x: number; y: number; width: number; height: number} = {x: 0, y: 0, width: 0, height: 0};
  public isFullscreen: boolean = false;

  public findMtga(account: AccountV8): void {
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
      } else {
        const display = screen.getPrimaryDisplay();
        const scaleFactor = isMac() ? 1 : display.scaleFactor;
        const processes = ourActiveWin.sync();
        //fs.appendFileSync(path, JSON.stringify({scaleFactor, processes}));
        //console.log(processes);
        if (processes) {
          // log(JSON.stringify(processes));
          const isMtgaWindow =
            processes.platform === 'macos'
              ? processes.owner.name === 'MTGA' &&
                processes.title === 'MTGA' &&
                processes.owner.bundleId === 'com.wizards.mtga'
              : processes.title === 'MTGA' && gameState.getProcessId() === processes.owner.processId;
          if (isMtgaWindow) {
            if (isMac()) {
              const overlayWindow = getOverlayWindow();
              if (overlayWindow && !overlayWindow.isFocused()) {
                overlayWindow.focus();
              }
            }
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
            //console.log(display);
            //console.log(processes.bounds);
          } else {
            this.bounds = {
              x: 0,
              y: 0,
              width: 0,
              height: 0,
            };
          }
        }
      }
    } catch (e) {
      // error('findMtga', e);
      // console.log(e);
      //fs.appendFileSync(path, e);
    }
  }
}
