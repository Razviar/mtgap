import electron from 'electron';
import path from 'path';
import fs from 'fs';
import chokidar from 'chokidar';

export class LogParser {
  private path: string;
  constructor(targetname: string[]) {
    const appDataPath = (electron.app || electron.remote.app).getPath(
      'appData'
    );
    this.path = path.join(appDataPath, ...targetname).replace('Roaming\\', '');
    //console.log(this.path);
  }

  public checkLog() {
    chokidar
      .watch(this.path, { usePolling: true, interval: 500 })
      .on('change', e => console.log(`File ${e} has been changed`));

    /*const file = fs.readFile(this.path, 'utf8', (err, data) => {
      console.log(err);
      //console.log(data);
    });*/
    return 1;
  }
}
