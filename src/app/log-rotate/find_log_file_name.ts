import {findLogPath} from 'root/app/log-rotate/find_log_path';

export function findLogFileName(appName: string = '', date: string): string {
  return [findLogPath(appName), date, '_', 'log.log'].join('');
}
