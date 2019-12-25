import fs from 'fs';
import path from 'path';

import {checkFileBeforeUpload, doFileUpload} from 'root/api/checkFileBeforeUpload';
import {error} from 'root/lib/logger';

export function uploadCardData(FilesOfInterest: string[], pathElements: string[]): void {
  const x64 = process.arch === 'x64' || process.env.hasOwnProperty('PROCESSOR_ARCHITEW6432');
  const progFiles = process.env[`ProgramFiles${x64 ? '(x86)' : ''}`];
  if (progFiles === undefined) {
    return;
  }
  const pth = path.join(progFiles, ...pathElements);
  try {
    const dirToScan = fs.readdirSync(pth);
    dirToScan
      .filter(file => {
        let pass = false;
        FilesOfInterest.forEach(foi => {
          if (file.includes(foi) && !file.includes('.dat')) {
            pass = true;
          }
        });
        return pass;
      })
      .forEach(interestingFile => {
        fs.readFile(path.join(pth, interestingFile), 'utf8', (err: NodeJS.ErrnoException | null, data: string) => {
          fileUploader(err, data, interestingFile);
        });
      });
  } catch (e) {
    error('Failure to read ProgramFiles dir', e, {progFiles, pth});
  }
}

const fileUploader = (err: NodeJS.ErrnoException | null, data: string, filename: string) => {
  if (err !== null) {
    error('Failure to read MTGA resources files', err);
  }
  checkFileBeforeUpload(filename)
    .then(res => {
      if (res) {
        doFileUpload(data, filename).catch(errr => {
          error('Failure to upload MTGA resources files', errr);
        });
      }
    })
    .catch(errr => {
      error('Failure to check MTGA resources files status', errr);
    });
};
