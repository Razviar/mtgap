import {settingsStore} from 'root/app/settings-store/settings_store';
import {asMap, asString} from 'root/lib/type_utils';
import {isMac} from 'root/lib/utils';

// tslint:disable-next-line:no-any
function loadAppIconInternal(type: string | undefined): any {
  // tslint:disable:no-require-imports
  if (isMac()) {
    return require('root/statics/icon.icns');
  }
  if (type === '') {
    return require('root/statics/icon.ico');
  }
  if (type === '1') {
    return require('root/statics/icon1.ico');
  }
  if (type === '2') {
    return require('root/statics/icon2.ico');
  }
  if (type === '3') {
    return require('root/statics/icon3.ico');
  }
  if (type === '4') {
    return require('root/statics/icon4.ico');
  }
  return require('root/statics/icon.ico');
  // tslint:enable:no-require-imports
}

export function loadAppIcon(type: string | undefined): string {
  return asString(asMap(loadAppIconInternal(type), {}).default, '');
}

let appIcon: string | undefined;

export function getAppIcon(): string {
  if (appIcon === undefined) {
    appIcon = loadAppIcon(settingsStore.get().icon);
  }
  return appIcon;
}
