import {screen} from 'electron';

import {settingsStore} from 'root/app/settings-store/settings_store';
import ourActiveWin from 'root/our-active-win';

export class WindowLocator {
  public bounds: {x: number; y: number; width: number; height: number} = {x: 0, y: 0, width: 0, height: 0};

  public findmtga(pid: number): void {
    /*const path = join(app.getPath('userData'), 'debugging.txt');
    fs.appendFileSync(path, JSON.stringify({pid}));*/
    //console.log('findmtga');
    try {
      const account = settingsStore.getAccount();

      if (account === undefined) {
        //console.log('no account');
        return;
      }

      if (account.overlaySettings?.detach) {
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
        const scaleFactor = display.scaleFactor;
        const processes = ourActiveWin.sync();
        //fs.appendFileSync(path, JSON.stringify({scaleFactor, processes}));
        //console.log(processes);
        if (processes) {
          const pidwin = processes.owner.processId;
          //console.log(pidwin);
          if (pidwin === pid) {
            const xMargin = 6;
            const yMargin = 30;
            const heightReduce = 38;
            if (
              processes.bounds.y === 0 &&
              processes.bounds.width === display.bounds.width * scaleFactor &&
              processes.bounds.height === display.bounds.height * scaleFactor
            ) {
              //console.log('FullScreen!');
              const monitorNumber = processes.bounds.x / processes.bounds.width;
              this.bounds = {
                x: monitorNumber * display.bounds.width,
                y: 0,
                width: display.bounds.width,
                height: display.bounds.height,
              };
            } else {
              this.bounds = {
                x: Math.round(processes.bounds.x / scaleFactor) + xMargin,
                y: Math.round(processes.bounds.y / scaleFactor) + yMargin,
                width: Math.round(processes.bounds.width / scaleFactor) - 10,
                height: Math.round(processes.bounds.height / scaleFactor - heightReduce),
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
      //console.log(e);
      //fs.appendFileSync(path, e);
    }
  }
}
