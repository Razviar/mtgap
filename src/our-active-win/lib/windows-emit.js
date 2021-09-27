'use strict';
import {join} from 'path';
import {spawn} from 'child_process';

const bin = join(__dirname, '../getFrontWindow.exe');

export function launch(JustDoInjection) {
  const positionDataReader = spawn(bin, JustDoInjection ? ['JustDoInjection'] : undefined);
  return positionDataReader;
}
