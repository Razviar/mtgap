import psList from 'ps-list';

import {ProcessWatching} from 'root/main';

export class ProcessWatcher {
  private readonly pname: string;

  constructor(processname: string) {
    this.pname = processname;
  }

  public async getprocesses(): Promise<number> {
    if (ProcessWatching.pid <= 0) {
      const pid = await this.locateMTGApid();
      return pid;
    } else {
      if (!this.checkMTGArunning(ProcessWatching.pid)) {
        ProcessWatching.pid = -1;
      }
      return ProcessWatching.pid;
    }
  }

  private async locateMTGApid(): Promise<number> {
    const processes = await psList();
    const res = processes.find((proc) => proc.name === this.pname);
    //console.log(res);
    if (res) {
      return res.pid;
    } else {
      return -1;
    }
  }

  private checkMTGArunning(pid: number): boolean {
    try {
      process.kill(pid, 0);
      return true;
    } catch (e) {
      return false;
    }
  }
}
