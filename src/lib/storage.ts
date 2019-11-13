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

    this.data = this.parseDataFile(this.path, opts.defaults);
  }

  public get(key: string, subkey?: any) {
    if (subkey) {
      return this.data['settings'][key][subkey];
    } else {
      return this.data[key];
    }
  }

  public getall(): { [index: string]: any } {
    return this.data;
  }

  public set(key: string, val: any, subkey?: any) {
    if (subkey) {
      if (!this.data['settings']) {
        this.data['settings'] = {};
      }
      if (!this.data['settings'][key]) {
        this.data['settings'][key] = {};
      }
      this.data['settings'][key][subkey] = val;
    } else {
      if (!this.data[key]) {
        this.data[key] = '';
      }
      this.data[key] = val;
    }
    try {
      fs.writeFileSync(this.path, JSON.stringify(this.data));
    } catch (e) {}
  }

  private parseDataFile(filePath: string, defaults: any) {
    try {
      return JSON.parse(fs.readFileSync(filePath, 'utf8'));
    } catch (error) {
      return defaults;
    }
  }
}
