import {createWriteStream, renameSync, statSync, WriteStream} from 'fs';
import * as _ from 'lodash';
import moment from 'moment';
import {EOL} from 'os';

import {findLogFileName} from 'root/app/log-rotate/find_log_file_name';

let file: string | undefined;
let stream: WriteStream | undefined;
let date: string;

export function transportFile(msg: string, appName: string, maxSize: number): boolean {
  const text = msg;

  date = dateDetermination(date);

  if (!stream) {
    file = file !== undefined ? file : findLogFileName(appName, date);

    if (maxSize > 0) {
      logRotate(file, maxSize);
    }

    stream = createWriteStream(file, {flags: 'a'}) as WriteStream | undefined;
  }

  if (!stream) {
    return false;
  }

  stream.write([text, EOL].join(''));

  return true;
}

function dateDetermination(d: string): string {
  const now: string = getNowDate();

  if (d !== now) {
    stream = undefined;
    file = undefined;
  }

  return now;
}

function logRotate(_file: string, maxSize: number): void {
  try {
    const stat = statSync(_file);
    if (stat.size > maxSize) {
      renameSync(
        _file,
        _file.replace(
          /log$/,
          `${Math.random()
            .toString()
            // tslint:disable-next-line: no-magic-numbers
            .substr(2, 5)}.log`
        )
      );
    }
  } catch (e) {
    // error
  }
}

function getNowDate(): string {
  return `${moment().get('year')}-${_.padStart((moment().get('month') + 1).toString(), 2, '0')}-${_.padStart(
    moment().get('date').toString(),
    2,
    '0'
  )}`;
}
