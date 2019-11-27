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
  console.error({msg, err: String(err), type: 'Error', ...extra, stack: getStacktrace(err)}); // tslint:disable-line:no-console
}
