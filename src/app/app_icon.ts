import {settingsStore} from 'root/app/settings-store/settings_store';
import {asMap, asString} from 'root/lib/type_utils';
import {isMac} from 'root/lib/utils';

// tslint:disable-next-line:no-any
function loadAppIconInternal(type: string | undefined): any {
  // tslint:disable:no-require-imports
  if (type === undefined) {
    type = '';
  }
  if (isMac()) {
    require(`root/statics/mac/mac-icon${type}@2x.png`);
    require(`root/statics/mac/mac-icon${type}@3x.png`);
    require(`root/statics/mac/mac-icon${type}@4x.png`);
    require(`root/statics/mac/mac-icon${type}@5x.png`);
    return require(`root/statics/mac/mac-icon${type}.png`);
  }
  return require(`root/statics/icon${type}.ico`);
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
