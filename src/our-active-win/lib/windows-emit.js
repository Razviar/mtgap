'use strict';
import {join} from 'path';
import {spawn} from 'child_process';

const bin = join(__dirname, '../getFrontWindow2.exe');

export function launch() {
  const positionDataReader = spawn(bin);
  return positionDataReader;
}
