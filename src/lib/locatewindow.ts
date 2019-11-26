import { screen } from 'electron';
import activeWin from 'active-win';

export class WindowLocator {
  public bounds: { x: number; y: number; width: number; height: number } = { x: 0, y: 0, width: 0, height: 0 };

  public findmtga(pid: number) {
    const scaleFactor = screen.getPrimaryDisplay().scaleFactor;
    const processes = activeWin.sync();
    if (processes) {
      const pidwin = processes.owner.processId;
      if (pidwin === pid) {
        this.bounds = {
          x: Math.round(processes.bounds.x / scaleFactor) + 6,
          y: Math.round(processes.bounds.y / scaleFactor),
          width: Math.round(processes.bounds.width / scaleFactor) - 10,
          height: Math.round(processes.bounds.height / scaleFactor - 8),
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
