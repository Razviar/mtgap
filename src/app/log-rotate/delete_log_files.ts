import {readdirSync, unlinkSync} from 'fs';
import * as _ from 'lodash';
import moment from 'moment';

import {findLogPath} from 'root/app/log-rotate/find_log_path';

const format = 'YYYY-MM-DD';

interface YearMonthDayInterface {
  year: string;
  month: string;
  day: string;
}

export function deleteLogFiles(howManyDaysAgo: number, appName: string): void {
  const path: string = findLogPath(appName);
  let files: string[] = [];
  try {
    files = readdirSync(path);
  } catch (e) {
    return;
  }

  _.forEach(files, (file: string, index: number) => {
    const yearMonthDay = getYearMonthDay(file);
    if (!yearMonthDay) {
      return;
    }

    if (!isBefore(howManyDaysAgo, yearMonthDay)) {
      return;
    }

    deleteLogFile(path + file);
  });
}

function getYearMonthDay(file: string): YearMonthDayInterface | undefined {
  const numberOfElements = 3;
  const split: string[] = _.split(file, '-', numberOfElements);
  if (split.length < numberOfElements) {
    return undefined;
  }

  // tslint:disable-next-line: no-object-literal-type-assertion
  return {
    year: split[0],
    month: split[1],
    day: _.split(split[2], '_', 1)[0],
  } as YearMonthDayInterface;
}

function isBefore(howManyDaysAgo: number, yearMonthDay: YearMonthDayInterface): boolean {
  const agoDays = moment(moment().format(format)).subtract(howManyDaysAgo, 'days');
  const fileDays = moment([yearMonthDay.year, yearMonthDay.month, yearMonthDay.day].join('-'));
  return moment(fileDays).isBefore(agoDays);
}

function deleteLogFile(filePath: string): void {
  try {
    unlinkSync(filePath);
  } catch (e) {
    return;
  }
}
