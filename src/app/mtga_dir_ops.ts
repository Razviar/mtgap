import {app} from 'electron';
import fs from 'fs';
import {join} from 'path';

import {parseOldLogsHandler} from 'root/app/old-log-handler';
import {settingsStore} from 'root/app/settings-store/settings_store';
import {error} from 'root/lib/logger';
import {isMac} from 'root/lib/utils';

export function locateMtgaDir(checkPath: string | undefined): boolean {
  let pth = '';
  if (checkPath !== undefined && fs.existsSync(checkPath)) {
    pth = checkPath;
  } else {
    const MtgaPathLocator: string[][] = [];

    if (isMac()) {
      MtgaPathLocator.push([app.getPath('home'), 'Library', 'Application Support', 'com.wizards.mtga']);
    } else {
      const progFiles = process.env['ProgramFiles'];
      const progFilesX86 = process.env['ProgramFiles(x86)'];
      const disk = process.env['SystemDrive'];

      if (progFiles === undefined) {
        return false;
      }
      if (disk !== undefined) {
        MtgaPathLocator.push([disk, 'SteamLibrary', 'steamapps', 'common', 'MTGA', 'MTGA_Data']);
      }
      MtgaPathLocator.push([progFiles, 'Wizards of the Coast', 'MTGA', 'MTGA_Data']);
      MtgaPathLocator.push([progFiles, 'Epic Games', 'MagicTheGathering', 'MTGA_Data']);
      MtgaPathLocator.push([progFiles, 'Steam', 'steamapps', 'common', 'MTGA', 'MTGA_Data']);
      if (progFilesX86 !== undefined) {
        MtgaPathLocator.push([progFilesX86, 'Steam', 'steamapps', 'common', 'MTGA', 'MTGA_Data']);
      }
    }

    let pathFound = false;
    MtgaPathLocator.forEach((possiblePathElements) => {
      if (pathFound) {
        return;
      }
      const testPth = join(...possiblePathElements);
      //console.log(testPth);
      if (fs.existsSync(testPth)) {
        //console.log('exists!');
        pth = testPth;
        pathFound = true;
      }
    });
  }

  let result = false;
  const settings = settingsStore.get();
  try {
    if (fs.existsSync(join(pth, 'Logs', 'Logs'))) {
      result = true;
      settings.mtgaPath = pth;
    } else if (fs.existsSync(join(pth, 'MTGA_Data', 'Logs', 'Logs'))) {
      result = true;
      settings.mtgaPath = join(pth, 'MTGA_Data');
    } else {
      result = false;
      settings.mtgaPath = undefined;
    }
  } catch (e) {
    result = false;
    settings.mtgaPath = undefined;
  }
  //console.log('settingsStore', settingsStore.get().mtgaPath);
  settingsStore.save();

  return result;
}

interface MostRecentDate {
  date: number | undefined;
  fileId: string | undefined;
  logPath: string | undefined;
}

export function locateMostRecentDate(): MostRecentDate {
  const mtgaPath = settingsStore.get().mtgaPath;
  //console.log('locateMostRecentDate', mtgaPath);
  if (mtgaPath === undefined) {
    return {date: undefined, fileId: undefined, logPath: undefined};
  }
  let logDate: Date | undefined;
  let fileId: string | undefined;
  let logPath: string | undefined;
  const pth = join(mtgaPath, ...['Logs', 'Logs']);
  //console.log(pth);
  try {
    const files = fs.readdirSync(pth);
    files.forEach((file) => {
      //console.log(file);
      logPath = join(pth, file);
      const ctime = fs.statSync(logPath).ctime;
      if (logDate === undefined || logDate < ctime) {
        logDate = ctime;
        fileId = file;
        //console.log(logDate);
      }
    });
  } catch (e) {
    error('Error reading files in logs folder', e);
  }

  //console.log('returning', logDate?.getTime());
  return {date: logDate?.getTime(), fileId, logPath};
}

export function getOldLogs(): string[] | undefined {
  const mtgaPath = settingsStore.get().mtgaPath;
  if (mtgaPath === undefined) {
    return undefined;
  }
  const pth = join(mtgaPath, ...['Logs', 'Logs']);
  const files: string[] = [];
  try {
    fs.readdirSync(pth)
      .filter((file) => file.includes('UTC_Log') && file.includes('.log'))
      .forEach((file) => {
        files.push(join(mtgaPath, ...['Logs', 'Logs'], file));
      });
  } catch (e) {
    error('Error reading files in logs folder', e);
  }
  return files;
}

export function ShadowLogParse(): void {
  const logs = getOldLogs();
  if (logs === undefined) {
    return;
  }
  parseOldLogsHandler(logs, 0, 0, true);
}
