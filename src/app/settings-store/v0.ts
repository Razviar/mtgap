import {Player, SettingsBase, Version} from 'root/app/settings-store/settings_store';

export interface SettingsV1 extends SettingsBase {
  version: Version.v1;
  accounts: AccountV0[];
  userToken?: string;
  icon?: string;
  autorun: boolean;
  minimized: boolean;
  overlay: boolean;
  manualUpdate: boolean;
  awaiting?: Player;
  logPath?: string;
}
export interface AccountV0 {
  uid: string;
  token: string;
  nick: string;
  overlay: boolean;
  player?: Player;
  overlaySettings?: OverlaySettingsV0;
}
export interface OverlaySettingsV0 {
  leftdigit: number;
  rightdigit: number;
  bottomdigit: number;
  hidemy: boolean;
  hideopp: boolean;
  hidezero: boolean;
  showcardicon: boolean;
  neverhide: boolean;
  mydecks: boolean;
  cardhover: boolean;
  timers: boolean;
}
