import {Player, SettingsBase, Version} from 'root/app/settings-store/settings_store';

export interface SettingsV3 extends SettingsBase {
  version: Version.v3;
  accounts: AccountV3[];
  userToken?: string;
  icon?: string;
  autorun: boolean;
  minimized: boolean;
  overlay: boolean;
  manualUpdate: boolean;
  awaiting?: Player;
  logPath?: string;
}
export interface AccountV3 {
  uid: string;
  token: string;
  nick: string;
  overlay: boolean;
  player?: Player;
  overlaySettings?: OverlaySettingsV3;
}
export interface OverlaySettingsV3 {
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
}
