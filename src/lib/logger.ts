import electronIsDev from 'electron-is-dev';

import {log} from 'root/app/log-rotate/log_rotate';
import {asMap, asString} from 'root/lib/type_utils';

interface LogProperties {
  [key: string]: any; // tslint:disable-line:no-any
}

interface ErrorWithStack {
  stack: string;
}

function getStacktrace(err?: unknown): string {
  const stack = asString(asMap(err, {}).stack);
  if (stack !== undefined) {
    return stack;
  }
  const errorWithStack = {};
  Error.captureStackTrace(errorWithStack);
  return (errorWithStack as ErrorWithStack).stack;
}

export function error(msg: string, err: unknown, extra: LogProperties = {}): void {
  if (electronIsDev) {
    console.error({msg, err: String(err), type: 'Error', ...extra, stack: getStacktrace(err)}); // tslint:disable-line:no-console
  } else {
    log(`${JSON.stringify({date: new Date().toISOString(), msg, err, stacktrace: getStacktrace(err), extra})}`);
  }
}
