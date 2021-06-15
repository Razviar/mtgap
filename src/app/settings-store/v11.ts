import {Player, SettingsBase, Version} from 'root/app/settings-store/settings_store';
import {OverlaySettingsV7} from 'root/app/settings-store/v10';

export interface SettingsV11 extends SettingsBase {
  version: Version.v11;
  accounts: AccountV10[];
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

export interface AccountV10 {
  game: 'mtga' | 'lor';
  uid: string;
  token: string;
  nick: string;
  overlay: boolean;
  player?: Player;
  overlaySettings?: OverlaySettingsV7;
  hotkeysSettings?: HotkeysSettingsV2;
}

export interface HotkeysSettingsV2 {
  'hk-my-deck': string;
  'hk-opp-deck': string;
  'hk-overlay': string;
  'hk-inc-size': string;
  'hk-dec-size': string;
  'hk-inc-opac': string;
  'hk-dec-opac': string;
  'hk-restart-mtga': string;
}
