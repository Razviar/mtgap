import psList from 'ps-list';

export class ProcessWatcher {
  private readonly pname: string;

  constructor(processname: string) {
    this.pname = processname;
  }

  public async getprocesses(): Promise<number> {
    const processes = await psList();
    const res = processes.find(proc => proc.name === this.pname);
    if (res) {
      return res.pid;
    } else {
      return -1;
    }
  }
}
