import {Player, SettingsBase, Version} from 'root/app/settings-store/settings_store';

export interface SettingsV6 extends SettingsBase {
  version: Version.v6;
  accounts: AccountV6[];
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
export interface AccountV6 {
  uid: string;
  token: string;
  nick: string;
  overlay: boolean;
  player?: Player;
  overlaySettings?: OverlaySettingsV6;
}
export interface OverlaySettingsV6 {
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
}
