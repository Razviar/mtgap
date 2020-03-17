import {Player, SettingsBase, Version} from 'root/app/settings-store/settings_store';
import {OverlaySettingsV6} from 'root/app/settings-store/v6';
import {HotkeysSettingsV1} from 'root/app/settings-store/v8';

export interface SettingsV9 extends SettingsBase {
  version: Version.v9;
  accounts: AccountV8[];
  userToken?: {mtga?: string; lor?: string};
  lastGame: 'mtga' | 'lor';
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

export interface AccountV8 {
  game: 'mtga' | 'lor';
  uid: string;
  token: string;
  nick: string;
  overlay: boolean;
  player?: Player;
  overlaySettings?: OverlaySettingsV6;
  hotkeysSettings?: HotkeysSettingsV1;
}
