import {Player, SettingsBase, Version} from 'root/app/settings-store/settings_store';
import {HotkeysSettingsV1} from 'root/app/settings-store/v8';

export interface SettingsV10 extends SettingsBase {
  version: Version.v10;
  accounts: AccountV9[];
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

export interface AccountV9 {
  game: 'mtga' | 'lor';
  uid: string;
  token: string;
  nick: string;
  overlay: boolean;
  player?: Player;
  overlaySettings?: OverlaySettingsV7;
  hotkeysSettings?: HotkeysSettingsV1;
}

export interface OverlaySettingsV7 {
  leftdigit: number;
  rightdigit: number;
  bottomdigit: number;
  rightdraftdigit: number;
  leftdraftdigit: number;
  hidemy: boolean;
  hideopp: boolean;
  hidezero: boolean;
  showcardicon: boolean;
  neverhide: boolean;
  mydecks: boolean;
  cardhover: boolean;
  timers: boolean;
  savepositiontop: number;
  savepositionleft: number;
  savepositiontopopp: number;
  savepositionleftopp: number;
  savescale: number;
  opacity: number;
  fontcolor: number;
  detach: boolean;
  hidemain: boolean;
  interactive: boolean;
}
