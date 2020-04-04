import {app} from 'electron';
import {readFileSync, writeFileSync} from 'fs';
import {join} from 'path';

import {error} from 'root/lib/logger';
import {asMap, asNumber} from 'root/lib/type_utils';

type OldPath = string & {_: 'OldPath'};

class OldStore {
  private readonly path: OldPath;
  private data: LatestOld;

  constructor() {
    this.path = join(app.getPath('userData'), 'parsed-files.json') as OldPath;

    try {
      const raw = JSON.parse(readFileSync(this.path, 'utf8'));
      const rawMap = asMap(raw);
      if (!rawMap) {
        throw new Error('Invalid JSON');
      }
      const version = asNumber(rawMap.version, Version.v0);
      // tslint:disable-next-line: no-object-literal-type-assertion
      this.data = parseStates({...rawMap, version} as AllStates);
    } catch (e) {
      this.data = createDefault();
    }
    this.rotate();
  }

  public checkLog(fileId: string, logName: string): boolean {
    return (
      this.data.fileIds.find((fid) => fid.fileId === fileId) !== undefined ||
      this.data.logNames.find((fid) => fid.logName === logName) !== undefined
    );
  }

  public wipe(): void {
    this.data = createDefault();
    this.save();
  }

  public saveFileID(timestamp: number, fileId: string): void {
    this.data.fileIds.push({timestamp, fileId});
    this.save();
  }

  public saveLogName(timestamp: number, logName: string): void {
    this.data.logNames.push({timestamp, logName});
    this.save();
  }

  private save(): void {
    try {
      writeFileSync(this.path, JSON.stringify(this.data));
    } catch (e) {
      error('OldStore.set', e);
    }
  }

  private rotate(): void {
    const rotationPeriod = 2419200000;
    this.data.fileIds = this.data.fileIds.filter((elem) => elem.timestamp >= new Date().getTime() - rotationPeriod);
    this.data.logNames = this.data.logNames.filter((elem) => elem.timestamp >= new Date().getTime() - rotationPeriod);
    this.save();
  }
}

export type LatestOld = OldV0;
type AllStates = OldV0 | LatestOld;

enum Version {
  v0,
}

interface OldBase {
  version: Version;
}

interface OldV0 extends OldBase {
  version: Version.v0;
  fileIds: {timestamp: number; fileId: string}[];
  logNames: {timestamp: number; logName: string}[];
}

function parseStates(states: AllStates): LatestOld {
  return states;
}

function createDefault(): LatestOld {
  return parseStates({version: Version.v0, fileIds: [], logNames: []});
}

export const oldStore = new OldStore();
