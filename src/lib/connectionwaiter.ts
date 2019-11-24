import Request from 'root/lib/request';

export class ConnectionWaiter {
  public status: boolean;

  constructor() {
    this.status = false;
  }

  public async pingMtga(version: string): Promise<boolean> {
    const res = await Request.get<{ [index: string]: string }>(`/mtg/donew2.php?cmd=cm_checkconn&version=${version}`);
    if (res && res.status && res.status === 'OK') {
      this.status = true;
      return this.status;
    } else {
      this.status = false;
      return this.status;
    }
  }
}
