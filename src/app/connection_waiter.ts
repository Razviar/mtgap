import {pingMtga} from 'root/api/connectionwaiter';

export class ConnectionWaiter {
  public status: boolean;

  constructor() {
    this.status = false;
  }

  public async pingMtga(version: string): Promise<boolean> {
    const statusOk = await pingMtga(version);
    this.status = statusOk;
    return statusOk;
  }
}
