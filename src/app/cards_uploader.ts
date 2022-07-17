import fs from 'fs';
import {join} from 'path';

import {checkFileBeforeUpload, doFileUpload} from 'root/api/checkFileBeforeUpload';
import {error} from 'root/lib/logger';

export function uploadCardData(FilesOfInterest: string[], pathElements: string[]): void {
  const pth = join(...pathElements);
  fs.readdir(pth, (err, dirToScan) => {
    if (err !== null) {
      return;
    }

    dirToScan
      .filter((file) => {
        let pass = false;
        FilesOfInterest.forEach((foi) => {
          if (file.includes(foi) && !file.includes('.dat')) {
            pass = true;
          }
        });
        return pass;
      })
      .forEach((interestingFile) => {
        fs.readFile(join(pth, interestingFile), null, (errr: NodeJS.ErrnoException | null, data: Buffer) => {
          fileUploader(errr, data, interestingFile);
        });
      });
  });
}

const fileUploader = (err: NodeJS.ErrnoException | null, data: Buffer, filename: string) => {
  if (err !== null) {
    error('Failure to read MTGA resources files', err);
  }
  checkFileBeforeUpload(filename)
    .then((res) => {
      if (res) {
        doFileUpload(data, filename).catch((errr) => {
          error('Failure to upload MTGA resources files', errr);
        });
      }
    })
    .catch((errr) => {
      error('Failure to check MTGA resources files status', errr);
    });
};
