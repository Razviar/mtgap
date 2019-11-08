// tslint:disable: no-any
import electron from 'electron';
import path from 'path';
import fs from 'fs';

export class Store {
  private path: string;
  private data: { [index: string]: any };
  constructor(opts: {
    configName: string;
    defaults: { [index: string]: any };
  }) {
    const userDataPath = (electron.app || electron.remote.app).getPath(
      'userData'
    );
    this.path = path.join(userDataPath, `${opts.configName}.json`);

    this.data = parseDataFile(this.path, opts.defaults);
  }

  public get(key: string) {
    return this.data[key];
  }

  public getall() {
    return this.data;
  }

  public set(key: string, val: any) {
    if (!this.data[key]) {
      this.data[key] = '';
    }
    this.data[key] = val;
    try {
      fs.writeFileSync(this.path, JSON.stringify(this.data));
    } catch (e) {}
  }
}

function parseDataFile(filePath: string, defaults: any) {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (error) {
    return defaults;
  }
}
