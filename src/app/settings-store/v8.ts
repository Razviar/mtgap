import {Player, SettingsBase, Version} from 'root/app/settings-store/settings_store';
import {OverlaySettingsV6} from 'root/app/settings-store/v6';

export interface SettingsV8 extends SettingsBase {
  version: Version.v8;
  accounts: AccountV7[];
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

export interface AccountV7 {
  uid: string;
  token: string;
  nick: string;
  overlay: boolean;
  player?: Player;
  overlaySettings?: OverlaySettingsV6;
  hotkeysSettings?: HotkeysSettingsV1;
}

export interface HotkeysSettingsV1 {
  'hk-my-deck': string;
  'hk-opp-deck': string;
  'hk-overlay': string;
  'hk-inc-size': string;
  'hk-dec-size': string;
  'hk-inc-opac': string;
  'hk-dec-opac': string;
}
