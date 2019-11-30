import {pingMtga} from 'root/api/connectionwaiter';

export class ConnectionWaiter {
  public status: boolean;

  constructor() {
    this.status = false;
  }

  public async pingMtga(): Promise<boolean> {
    const statusOk = await pingMtga();
    this.status = statusOk;
    return statusOk;
  }
}
