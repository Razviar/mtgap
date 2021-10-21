// tslint:disable: no-unsafe-any restrict-plus-operands prefer-template typedef no-any strict-boolean-expressions no-null-keyword
import {accessSync, constants, mkdirSync, statSync} from 'fs';

export function findLogPath(appName: string = ''): string {
  let dir = '';
  switch (process.platform) {
    case 'linux':
      dir = prepareDir(process.env['XDG_CONFIG_HOME'] + '', appName)
        .or(process.env['HOME'] + '/.config', appName)
        .or(process.env['XDG_DATA_HOME'] + '', appName)
        .or(process.env['HOME'] + '/.local/share', appName).result;
      break;
    case 'darwin':
      dir = prepareDir(process.env['HOME'] + '/Library/Logs', appName).or(
        process.env['HOME'] + '/Library/Application Support',
        appName
      ).result;
      break;
    case 'win32':
      dir = prepareDir(process.env['APPDATA'] + '', appName).or(process.env['HOME'] + '/AppData', appName).result;
      break;
    default:
      break;
  }

  return [dir, '/'].join('');
}

function prepareDir(this: any, path: string, appName: string) {
  if (!this || this.or !== prepareDir || !this.result) {
    if (!path) {
      return {or: prepareDir};
    }
    path = path + '/' + appName;
    mkDir(path);
    try {
      accessSync(path, constants.W_OK);
    } catch (e) {
      return {or: prepareDir};
    }
  }

  return {
    or: prepareDir,
    result: (this ? this.result : false) || path,
  };
}

function mkDir(path: string, root: string | null = null): string | boolean {
  const dirs: string[] = path.split('/');
  const dir: string | undefined = dirs.shift();
  root = (root || '') + dir + '/';

  try {
    mkdirSync(root);
  } catch (e) {
    if (!statSync(root).isDirectory()) {
      throw e;
    }
  }

  return !dirs.length || mkDir(dirs.join('/'), root);
}
