import {screen} from 'electron';

import ourActiveWin from 'root/our-active-win';

export class WindowLocator {
  public bounds: {x: number; y: number; width: number; height: number} = {x: 0, y: 0, width: 0, height: 0};

  public findmtga(pid: number): void {
    /*const path = join(app.getPath('userData'), 'debugging.txt');
    fs.appendFileSync(path, JSON.stringify({pid}));*/
    try {
      const scaleFactor = screen.getPrimaryDisplay().scaleFactor;
      const processes = ourActiveWin.sync();
      //fs.appendFileSync(path, JSON.stringify({scaleFactor, processes}));
      if (processes) {
        const pidwin = processes.owner.processId;
        if (pidwin === pid) {
          const xMargin = 6;
          const heightReduce = 8;
          this.bounds = {
            x: Math.round(processes.bounds.x / scaleFactor) + xMargin,
            y: Math.round(processes.bounds.y / scaleFactor),
            width: Math.round(processes.bounds.width / scaleFactor) - 10,
            height: Math.round(processes.bounds.height / scaleFactor - heightReduce),
          };
        } else {
          this.bounds = {
            x: 0,
            y: 0,
            width: 0,
            height: 0,
          };
        }
      }
    } catch (e) {
      //fs.appendFileSync(path, e);
    }
  }
}
