import activeWin from 'active-win';

export class WindowLocator {
  public bounds: { x: number; y: number; width: number; height: number } = { x: 0, y: 0, width: 0, height: 0 };

  public async findmtga(pid: number, scaleFactor: number) {
    const processes = await activeWin();

    if (processes) {
      const pidwin = processes.owner.processId;
      if (pidwin === pid) {
        this.bounds = {
          x: Math.round(processes.bounds.x / scaleFactor),
          y: Math.round(processes.bounds.y / scaleFactor),
          width: Math.round(processes.bounds.width / scaleFactor),
          height: Math.round(processes.bounds.height / scaleFactor),
        };
      }
    }
  }
}
