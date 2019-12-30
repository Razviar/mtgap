import fs from 'fs';
import path from 'path';

import {settingsStore} from 'root/app/settings-store/settings_store';
import {error} from 'root/lib/logger';

export function locateMtgaDir(pathElements: string[]): void {
  const x64 = process.arch === 'x64' || process.env.hasOwnProperty('PROCESSOR_ARCHITEW6432');
  const progFiles = process.env[`ProgramFiles${x64 ? '(x86)' : ''}`];
  if (progFiles === undefined) {
    return;
  }
  const pth = path.join(progFiles, ...pathElements);

  fs.readdir(pth, (err: NodeJS.ErrnoException | null, _): void => {
    if (err === null) {
      const settings = settingsStore.get();
      settings.mtgaPath = pth;
      settingsStore.save();
    } else {
      console.log('no MTGA found');
    }
  });
}

export function locateMostRecentDate(): Date | undefined {
  const mtgaPath = settingsStore.get().mtgaPath;
  if (mtgaPath === undefined) {
    return undefined;
  }
  let logDate: Date | undefined;
  const pth = path.join(mtgaPath, ...['MTGA_Data', 'Logs', 'Logs']);
  fs.readdir(pth, (err: NodeJS.ErrnoException | null, files: string[]): void => {
    if (err !== null) {
      return;
    }
    try {
      files.forEach(file => {
        const ctime = fs.statSync(path.join(pth, file)).ctime;
        if (logDate === undefined || logDate < ctime) {
          logDate = ctime;
        }
      });
    } catch (e) {
      error('Error reading files in logs folder', e);
    }
  });
  return logDate;
}
