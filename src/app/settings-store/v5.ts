import {Player, SettingsBase, Version} from 'root/app/settings-store/settings_store';
import {AccountV4} from 'root/app/settings-store/v4';

export interface SettingsV5 extends SettingsBase {
  version: Version.v5;
  accounts: AccountV4[];
  userToken?: string;
  icon?: string;
  autorun: boolean;
  minimized: boolean;
  overlay: boolean;
  manualUpdate: boolean;
  awaiting?: Player;
  logPath?: string;
  uploads?: boolean;
  nohotkeys?: boolean;
}
