import electronIsDev from 'electron-is-dev';
import ErrorStackParser from 'error-stack-parser';

import {errorReport} from 'root/api/erroreporter';
import {log} from 'root/app/log-rotate/log_rotate';
import {settingsStore} from 'root/app/settings-store/settings_store';
import {asMap, asString} from 'root/lib/type_utils';

interface LogProperties {
  [key: string]: any; // tslint:disable-line:no-any
}

interface ErrorWithStack {
  stack: string;
}

function getStacktrace(err?: unknown): ErrorWithStack {
  const stack = asString(asMap(err, {}).stack);
  if (stack !== undefined) {
    return err as ErrorWithStack;
  }
  const errorWithStack = {};
  Error.captureStackTrace(errorWithStack);
  return errorWithStack as ErrorWithStack;
}

export function error(msg: string, err: unknown, extra: LogProperties = {}, onlyLocal?: boolean): void {
  const errorWithStack = getStacktrace(err);
  //stacktrace
  const TheTrace = ErrorStackParser.parse(errorWithStack as Error);
  TheTrace.shift(); // getting rid of getStacktrace call
  TheTrace.shift(); // getting rid of Object.error at logger.ts call
  const TheError = TheTrace.shift(); // recieving details of error source

  if (electronIsDev) {
    console.error({msg, err: String(err), type: 'Error', ...extra, stack: errorWithStack.stack}); // tslint:disable-line:no-console
  } else {
    const account = settingsStore.getAccount();
    if (onlyLocal) {
      log(`${JSON.stringify({date: new Date().toISOString(), msg, err, stacktrace: errorWithStack.stack, extra})}`);
    } else {
      errorReport(
        account?.token,
        TheError?.fileName,
        TheError?.lineNumber,
        TheError?.columnNumber,
        TheError?.functionName,
        msg,
        JSON.stringify({err, stacktrace: errorWithStack.stack, extra})
      )
        .then((res) => {
          if (!res) {
            log(
              `${JSON.stringify({date: new Date().toISOString(), msg, err, stacktrace: errorWithStack.stack, extra})}`
            );
          }
        })
        .catch((_) => {
          log(`${JSON.stringify({date: new Date().toISOString(), msg, err, stacktrace: errorWithStack.stack, extra})}`);
        });
    }
  }
}
