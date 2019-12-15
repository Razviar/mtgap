'use strict';
import {join} from 'path';
import {promisify} from 'util';
import {execFile as _execFile, execFileSync} from 'child_process';

const execFile = promisify(_execFile);
const bin = join(__dirname, '../main');

const parseMac = stdout => {
  try {
    const result = JSON.parse(stdout);
    if (result !== null) {
      result.platform = 'macos';
      return result;
    }
  } catch (error) {
    console.error(error);
    throw new Error('Error parsing window data');
  }
};

export default async () => {
  const {stdout} = await execFile(bin);
  return parseMac(stdout);
};

export function sync() {
  return parseMac(execFileSync(bin, {encoding: 'utf8'}));
}
