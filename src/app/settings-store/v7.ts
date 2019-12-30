import {Player, SettingsBase, Version} from 'root/app/settings-store/settings_store';
import {AccountV6} from 'root/app/settings-store/v6';

export interface SettingsV7 extends SettingsBase {
  version: Version.v7;
  accounts: AccountV6[];
  userToken?: string;
  icon?: string;
  autorun: boolean;
  minimized: boolean;
  overlay: boolean;
  manualUpdate: boolean;
  awaiting?: Player;
  logPath?: string;
  mtgaPath?: string;
  uploads?: boolean;
  nohotkeys?: boolean;
}
