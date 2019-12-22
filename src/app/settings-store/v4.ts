import {Player, SettingsBase, Version} from 'root/app/settings-store/settings_store';

export interface SettingsV4 extends SettingsBase {
  version: Version.v4;
  accounts: AccountV4[];
  userToken?: string;
  icon?: string;
  autorun: boolean;
  minimized: boolean;
  overlay: boolean;
  manualUpdate: boolean;
  awaiting?: Player;
  logPath?: string;
}
export interface AccountV4 {
  uid: string;
  token: string;
  nick: string;
  overlay: boolean;
  player?: Player;
  overlaySettings?: OverlaySettingsV4;
}
export interface OverlaySettingsV4 {
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
}
