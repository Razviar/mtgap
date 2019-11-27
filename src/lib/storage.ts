// tslint:disable: no-any
import electron from 'electron';
import fs from 'fs';
import path from 'path';

export class Store {
  private readonly path: string;
  private data: {[index: string]: any};
  constructor(opts: {configName: string; defaults: {[index: string]: any}}) {
    const userDataPath = (electron.app || electron.remote.app).getPath('userData');
    this.path = path.join(userDataPath, `${opts.configName}.json`);

    this.data = this.parseDataFile(this.path, opts.defaults);
  }

  public get(key: string, subkey?: any) {
    try {
      if (subkey) {
        return this.data['settings'][key][subkey];
      } else {
        return this.data[key];
      }
    } catch (e) {
      return '';
    }
  }

  public getsettings(key: string) {
    try {
      return this.data['settings'][key];
    } catch (e) {
      return '';
    }
  }

  public getall(): {[index: string]: any} {
    return this.data;
  }

  public wipe() {
    this.data = {};
    try {
      fs.writeFileSync(this.path, JSON.stringify(this.data));
    } catch (e) {}
  }

  public unset(key: string, subkey?: any, whole?: boolean) {
    if (subkey) {
      if (whole) {
        delete this.data['settings'][key];
      } else {
        delete this.data['settings'][key][subkey];
      }
    } else {
      delete this.data[key];
    }
    try {
      fs.writeFileSync(this.path, JSON.stringify(this.data));
    } catch (e) {}
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
