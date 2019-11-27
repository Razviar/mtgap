import activeWin from 'active-win';
import {screen} from 'electron';

export class WindowLocator {
  public bounds: {x: number; y: number; width: number; height: number} = {x: 0, y: 0, width: 0, height: 0};

  public findmtga(pid: number): void {
    const scaleFactor = screen.getPrimaryDisplay().scaleFactor;
    const processes = activeWin.sync();
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
  }
}
