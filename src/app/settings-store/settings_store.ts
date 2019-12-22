import {app} from 'electron';
import {readFileSync, writeFileSync} from 'fs';
import {join} from 'path';

import {AccountV0, OverlaySettingsV0, SettingsV1} from 'root/app/settings-store/v0';
import {AccountV2, OverlaySettingsV2, SettingsV2} from 'root/app/settings-store/v2';
import {AccountV3, OverlaySettingsV3, SettingsV3} from 'root/app/settings-store/v3';
import {AccountV4, OverlaySettingsV4, SettingsV4} from 'root/app/settings-store/v4';
import {error} from 'root/lib/logger';
import {AnyMap, asBoolean, asMap, asNumber, asNumberString, asString} from 'root/lib/type_utils';

type StorePath = string & {_: 'StorePath'};

class SettingsStore {
  private readonly path: StorePath;
  private data: LatestSettings;

  constructor() {
    this.path = join(app.getPath('userData'), 'user-preferences.json') as StorePath;

    try {
      const raw = JSON.parse(readFileSync(this.path, 'utf8'));
      const rawMap = asMap(raw);
      if (!rawMap) {
        throw new Error('Invalid JSON');
      }
      const version = asNumber(rawMap.version, Version.v0);
      // tslint:disable-next-line: no-object-literal-type-assertion
      this.data = parseSettings({...rawMap, version} as AllSettings);
    } catch (e) {
      this.data = createDefault();
    }
    this.save();
  }

  public get(): LatestSettings {
    return this.data;
  }

  public set(newSettings: LatestSettings): void {
    this.data = newSettings;
    this.save();
  }

  public wipe(): void {
    this.data = createDefault();
    this.save();
  }

  public save(): void {
    try {
      writeFileSync(this.path, JSON.stringify(this.data));
    } catch (e) {
      error('SettingsStore.set', e);
    }
  }

  public getAccount(): Account | undefined {
    const token = this.data.userToken;
    if (token === undefined) {
      return undefined;
    }
    return this.data.accounts.find(_ => _.token === token);
  }

  public removeAccount(userToken: string): void {
    const accountIndex = this.data.accounts.findIndex(_ => _.token === userToken);
    if (accountIndex > -1) {
      this.data.accounts.splice(accountIndex, 1);
    }
  }
}

export type LatestSettings = SettingsV4;
export type OverlaySettings = OverlaySettingsV4;
export type Account = AccountV4;
type AllSettings = SettingsV0 | SettingsV1 | SettingsV2 | SettingsV3 | LatestSettings;

export enum Version {
  v0,
  v1,
  v2,
  v3,
  v4,
}

export interface SettingsBase {
  version: Version;
}

export interface SettingsV0 extends SettingsBase {
  version: Version.v0;
  // tslint:disable-next-line: no-any
  [index: string]: any;
}

export interface Player {
  playerId: string;
  screenName: string;
  language: string;
}

function asOverlaySettings(anyMap: AnyMap | undefined): OverlaySettingsV0 | undefined {
  if (!anyMap) {
    return undefined;
  }

  const leftdigit = asNumber(anyMap['leftdigit']);
  const rightdigit = asNumber(anyMap['rightdigit']);
  const bottomdigit = asNumber(anyMap['bottomdigit']);
  const hidemy = asBoolean(anyMap['hidemy']);
  const hideopp = asBoolean(anyMap['hideopp']);
  const hidezero = asBoolean(anyMap['hidezero']);
  const showcardicon = asBoolean(anyMap['showcardicon']);
  const timers = asBoolean(anyMap['timers']);
  const neverhide = asBoolean(anyMap['neverhide']);
  const mydecks = asBoolean(anyMap['mydecks']);
  const cardhover = asBoolean(anyMap['cardhover']);

  if (
    leftdigit === undefined ||
    rightdigit === undefined ||
    bottomdigit === undefined ||
    hidemy === undefined ||
    hideopp === undefined ||
    showcardicon === undefined ||
    timers === undefined ||
    neverhide === undefined ||
    cardhover === undefined ||
    mydecks === undefined ||
    hidezero === undefined
  ) {
    return undefined;
  }

  return {
    leftdigit,
    rightdigit,
    bottomdigit,
    hidemy,
    hideopp,
    hidezero,
    showcardicon,
    timers,
    neverhide,
    mydecks,
    cardhover,
  };
}

function asOverlaySettingsV2(ovlSettings: OverlaySettingsV0 | undefined): OverlaySettingsV2 | undefined {
  if (!ovlSettings) {
    return undefined;
  }

  const leftdigit = ovlSettings.leftdigit;
  const rightdigit = ovlSettings.rightdigit;
  const bottomdigit = ovlSettings.bottomdigit;
  const rightdraftdigit = 3;
  const leftdraftdigit = 1;
  const hidemy = ovlSettings.hidemy;
  const hideopp = ovlSettings.hideopp;
  const hidezero = ovlSettings.hidezero;
  const showcardicon = ovlSettings.showcardicon;
  const timers = ovlSettings.timers;
  const neverhide = ovlSettings.neverhide;
  const mydecks = ovlSettings.mydecks;
  const cardhover = ovlSettings.cardhover;

  return {
    leftdigit,
    rightdigit,
    bottomdigit,
    rightdraftdigit,
    leftdraftdigit,
    hidemy,
    hideopp,
    hidezero,
    showcardicon,
    timers,
    neverhide,
    mydecks,
    cardhover,
  };
}

function asOverlaySettingsV3(ovlSettings: OverlaySettingsV2 | undefined): OverlaySettingsV3 | undefined {
  if (!ovlSettings) {
    return undefined;
  }

  const leftdigit = ovlSettings.leftdigit;
  const rightdigit = ovlSettings.rightdigit;
  const bottomdigit = ovlSettings.bottomdigit;
  const rightdraftdigit = ovlSettings.rightdraftdigit;
  const leftdraftdigit = ovlSettings.leftdigit;
  const hidemy = ovlSettings.hidemy;
  const hideopp = ovlSettings.hideopp;
  const hidezero = ovlSettings.hidezero;
  const showcardicon = ovlSettings.showcardicon;
  const timers = ovlSettings.timers;
  const neverhide = ovlSettings.neverhide;
  const mydecks = ovlSettings.mydecks;
  const cardhover = ovlSettings.cardhover;
  const savepositiontop = 0;
  const savepositionleft = 0;
  const savepositiontopopp = 0;
  const savepositionleftopp = 0;
  const savescale = 0;
  const opacity = 0;

  return {
    leftdigit,
    rightdigit,
    bottomdigit,
    rightdraftdigit,
    leftdraftdigit,
    hidemy,
    hideopp,
    hidezero,
    showcardicon,
    timers,
    neverhide,
    mydecks,
    cardhover,
    savepositiontop,
    savepositionleft,
    savepositiontopopp,
    savepositionleftopp,
    savescale,
    opacity,
  };
}

function asOverlaySettingsV4(ovlSettings: OverlaySettingsV3 | undefined): OverlaySettingsV4 | undefined {
  if (!ovlSettings) {
    return undefined;
  }

  const leftdigit = ovlSettings.leftdigit;
  const rightdigit = ovlSettings.rightdigit;
  const bottomdigit = ovlSettings.bottomdigit;
  const rightdraftdigit = ovlSettings.rightdraftdigit;
  const leftdraftdigit = ovlSettings.leftdigit;
  const hidemy = ovlSettings.hidemy;
  const hideopp = ovlSettings.hideopp;
  const hidezero = ovlSettings.hidezero;
  const showcardicon = ovlSettings.showcardicon;
  const timers = ovlSettings.timers;
  const neverhide = ovlSettings.neverhide;
  const mydecks = ovlSettings.mydecks;
  const cardhover = ovlSettings.cardhover;
  const savepositiontop = ovlSettings.savepositiontop;
  const savepositionleft = ovlSettings.savepositionleft;
  const savepositiontopopp = ovlSettings.savepositiontopopp;
  const savepositionleftopp = ovlSettings.savepositionleftopp;
  const savescale = ovlSettings.savescale;
  const opacity = ovlSettings.opacity;
  const fontcolor = 0;

  return {
    leftdigit,
    rightdigit,
    bottomdigit,
    rightdraftdigit,
    leftdraftdigit,
    hidemy,
    hideopp,
    hidezero,
    showcardicon,
    timers,
    neverhide,
    mydecks,
    cardhover,
    savepositiontop,
    savepositionleft,
    savepositiontopopp,
    savepositionleftopp,
    savescale,
    opacity,
    fontcolor,
  };
}

function asPlayer(anyMap: AnyMap | undefined): Player | undefined {
  if (!anyMap) {
    return undefined;
  }

  const playerId = asString(anyMap['playerId']);
  const screenName = asString(anyMap['screenName']);
  const language = asString(anyMap['language']);

  if (playerId === undefined || screenName === undefined || language === undefined) {
    return undefined;
  }

  return {playerId, screenName, language};
}

function asAccountV0(anyMap: AnyMap): AccountV0[] {
  const res: AccountV0[] = [];

  for (const key of Object.keys(anyMap)) {
    const raw = asMap(anyMap[key]);
    if (!raw) {
      continue;
    }

    const uid = asNumberString(raw['uid']);
    const token = asString(raw['token']);
    const nick = asString(raw['nick']);
    const overlay = asBoolean(raw['overlay']);
    const player = asPlayer({
      playerId: raw['playerId'],
      screenName: raw['screenName'],
      language: raw['language'],
    });
    const overlaySettings = asOverlaySettings({
      leftdigit: raw['leftdigit'],
      rightdigit: raw['rightdigit'],
      bottomdigit: raw['bottomdigit'],
      hidemy: raw['hidemy'],
      hideopp: raw['hideopp'],
      hidezero: raw['hidezero'],
      showcardicon: raw['showcardicon'],
    });

    if (
      uid === undefined ||
      token === undefined ||
      nick === undefined ||
      overlay === undefined ||
      overlaySettings === undefined
    ) {
      continue;
    }

    res.push({uid, token, nick, overlay, player, overlaySettings});
  }

  return res;
}

function asAccountsV2(accountsV1: AccountV0[]): AccountV2[] {
  const res: AccountV2[] = [];
  accountsV1.forEach(accV1 => {
    res.push({
      uid: accV1.uid,
      token: accV1.token,
      nick: accV1.nick,
      overlay: accV1.overlay,
      player: accV1.player,
      overlaySettings: asOverlaySettingsV2(accV1.overlaySettings),
    });
  });
  return res;
}

function asAccountsV3(accountsV2: AccountV2[]): AccountV3[] {
  const res: AccountV3[] = [];
  accountsV2.forEach(acc => {
    res.push({
      uid: acc.uid,
      token: acc.token,
      nick: acc.nick,
      overlay: acc.overlay,
      player: acc.player,
      overlaySettings: asOverlaySettingsV3(acc.overlaySettings),
    });
  });
  return res;
}

function asAccountsV4(accountsV3: AccountV3[]): AccountV4[] {
  const res: AccountV4[] = [];
  accountsV3.forEach(acc => {
    res.push({
      uid: acc.uid,
      token: acc.token,
      nick: acc.nick,
      overlay: acc.overlay,
      player: acc.player,
      overlaySettings: asOverlaySettingsV4(acc.overlaySettings),
    });
  });
  return res;
}

function migrateV0toV1(v0: SettingsV0): SettingsV1 {
  return {
    version: Version.v1,
    accounts: asAccountV0(asMap(v0['settings'], {})),
    userToken: asString(v0['usertoken']),
    icon: asString(v0['icon']),
    autorun: asBoolean(v0['autorun'], false),
    minimized: asBoolean(v0['minimized'], false),
    overlay: asBoolean(v0['overlay'], false),
    manualUpdate: asBoolean(v0['manualupdate'], false),
    awaiting: asPlayer(asMap(v0['awaiting'])),
    logPath: asString(v0['logpath']),
  };
}

function migrateV1toV2(v1: SettingsV1): SettingsV2 {
  return {
    version: Version.v2,
    accounts: asAccountsV2(v1.accounts),
    userToken: v1.userToken,
    icon: v1.icon,
    autorun: v1.autorun,
    minimized: v1.minimized,
    overlay: v1.overlay,
    manualUpdate: v1.manualUpdate,
    awaiting: v1.awaiting,
    logPath: v1.logPath,
  };
}

function migrateV2toV3(v2: SettingsV2): SettingsV3 {
  return {
    version: Version.v3,
    accounts: asAccountsV3(v2.accounts),
    userToken: v2.userToken,
    icon: v2.icon,
    autorun: v2.autorun,
    minimized: v2.minimized,
    overlay: v2.overlay,
    manualUpdate: v2.manualUpdate,
    awaiting: v2.awaiting,
    logPath: v2.logPath,
  };
}

function migrateV3toV4(v3: SettingsV3): SettingsV4 {
  return {
    version: Version.v4,
    accounts: asAccountsV4(v3.accounts),
    userToken: v3.userToken,
    icon: v3.icon,
    autorun: v3.autorun,
    minimized: v3.minimized,
    overlay: v3.overlay,
    manualUpdate: v3.manualUpdate,
    awaiting: v3.awaiting,
    logPath: v3.logPath,
  };
}

function parseSettings(settings: AllSettings): LatestSettings {
  // Recursively parse settings and migrate them to arrive at latest version
  switch (settings.version) {
    case Version.v0:
      return parseSettings(migrateV0toV1(settings));
    case Version.v1:
      return parseSettings(migrateV1toV2(settings));
    case Version.v2:
      return parseSettings(migrateV2toV3(settings));
    case Version.v3:
      return parseSettings(migrateV3toV4(settings));
    default:
      return settings;
  }
}

function createDefault(): LatestSettings {
  return parseSettings({version: Version.v0});
}

export const settingsStore = new SettingsStore();
