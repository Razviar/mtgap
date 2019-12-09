import {app} from 'electron';
import {readFileSync, writeFileSync} from 'fs';
import {join} from 'path';

import {LogFileParsingState} from 'root/app/log-parser/model';
import {error} from 'root/lib/logger';
import {asMap, asNumber} from 'root/lib/type_utils';

type StorePath = string & {_: 'StorePath'};

class StateStore {
  private readonly path: StorePath;
  private data: LatestStates;

  constructor() {
    this.path = join(app.getPath('userData'), 'parser-state.json') as StorePath;

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
    this.save();
  }

  public get(): StateInfo | undefined {
    return this.data.stateInfo;
  }

  public wipe(): void {
    this.data = createDefault();
    this.save();
  }

  public saveState(stateInfo: StateInfo): void {
    this.data.stateInfo = stateInfo;
    this.save();
  }

  private save(): void {
    try {
      writeFileSync(this.path, JSON.stringify(this.data));
    } catch (e) {
      error('StateStore.set', e);
    }
  }
}

export type LatestStates = StatesV0;
type AllStates = StatesV0 | LatestStates;

enum Version {
  v0,
}

interface StatesBase {
  version: Version;
}

interface StatesV0 extends StatesBase {
  version: Version.v0;
  stateInfo?: StateInfo;
}

export interface StateInfo {
  fileId: string;
  state: LogFileParsingState;
}

function parseStates(states: AllStates): LatestStates {
  return states;
}

function createDefault(): LatestStates {
  return parseStates({version: Version.v0});
}

export const stateStore = new StateStore();
