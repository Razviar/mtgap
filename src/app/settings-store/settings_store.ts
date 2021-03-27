import {app} from 'electron';
import {readFileSync, writeFileSync} from 'fs';
import {join} from 'path';

import {AccountV0, OverlaySettingsV0, SettingsV1} from 'root/app/settings-store/v0';
import {AccountV9, OverlaySettingsV7, SettingsV10} from 'root/app/settings-store/v10';
import {AccountV10, SettingsV11} from 'root/app/settings-store/v11';
import {AccountV2, OverlaySettingsV2, SettingsV2} from 'root/app/settings-store/v2';
import {AccountV3, OverlaySettingsV3, SettingsV3} from 'root/app/settings-store/v3';
import {AccountV4, OverlaySettingsV4, SettingsV4} from 'root/app/settings-store/v4';
import {SettingsV5} from 'root/app/settings-store/v5';
import {AccountV6, OverlaySettingsV6, SettingsV6} from 'root/app/settings-store/v6';
import {SettingsV7} from 'root/app/settings-store/v7';
import {AccountV7, SettingsV8} from 'root/app/settings-store/v8';
import {AccountV8, SettingsV9} from 'root/app/settings-store/v9';
import {error} from 'root/lib/logger';
import {AnyMap, asBoolean, asMap, asNumber, asNumberString, asString} from 'root/lib/type_utils';
import {isMac} from 'root/lib/utils';

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
    const game = this.data.lastGame;
    const token = this.data.userToken;
    if (token === undefined) {
      return undefined;
    }
    const gameToken = token[game];
    return this.data.accounts.find((_) => _.token === gameToken);
  }

  public removeAccount(userToken: string): void {
    const accountIndex = this.data.accounts.findIndex((_) => _.token === userToken);
    if (accountIndex > -1) {
      this.data.accounts.splice(accountIndex, 1);
    }
  }
}

export type LatestSettings = SettingsV11;
export type OverlaySettings = OverlaySettingsV7;
export type Account = AccountV10;
type AllSettings =
  | SettingsV0
  | SettingsV1
  | SettingsV2
  | SettingsV3
  | SettingsV4
  | SettingsV5
  | SettingsV6
  | SettingsV7
  | SettingsV8
  | SettingsV9
  | SettingsV10
  | SettingsV11;

export enum Version {
  v0,
  v1,
  v2,
  v3,
  v4,
  v5,
  v6,
  v7,
  v8,
  v9,
  v10,
  v11,
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

function asOverlaySettingsV6(ovlSettings: OverlaySettingsV4 | undefined): OverlaySettingsV6 | undefined {
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
  const fontcolor = ovlSettings.fontcolor;
  const detach = false;
  const hidemain = false;

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
    detach,
    hidemain,
  };
}

function asOverlaySettingsV7(ovlSettings: OverlaySettingsV6 | undefined): OverlaySettingsV7 | undefined {
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
  const fontcolor = ovlSettings.fontcolor;
  const detach = false;
  const hidemain = false;
  const interactive = !isMac();

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
    detach,
    hidemain,
    interactive,
  };
}

function asPlayer(anyMap: AnyMap | undefined): Player | undefined {
  if (!anyMap) {
    return undefined;
  }

  const playerId = asString(anyMap['playerId']);
  const screenName = asString(anyMap['screenName']);

  if (playerId === undefined || screenName === undefined) {
    return undefined;
  }

  return {playerId, screenName};
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
  accountsV1.forEach((accV1) => {
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
  accountsV2.forEach((acc) => {
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
  accountsV3.forEach((acc) => {
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

function asAccountsV6(accountsV4: AccountV4[]): AccountV6[] {
  const res: AccountV6[] = [];
  accountsV4.forEach((acc) => {
    res.push({
      uid: acc.uid,
      token: acc.token,
      nick: acc.nick,
      overlay: acc.overlay,
      player: acc.player,
      overlaySettings: asOverlaySettingsV6(acc.overlaySettings),
    });
  });
  return res;
}

function asAccountsV7(accountsV6: AccountV6[]): AccountV7[] {
  const res: AccountV7[] = [];
  accountsV6.forEach((acc) => {
    res.push({
      uid: acc.uid,
      token: acc.token,
      nick: acc.nick,
      overlay: acc.overlay,
      player: acc.player,
      overlaySettings: asOverlaySettingsV6(acc.overlaySettings),
      hotkeysSettings: {
        'hk-my-deck': 'Q',
        'hk-opp-deck': 'W',
        'hk-overlay': '`',
        'hk-inc-size': 'A',
        'hk-dec-size': 'S',
        'hk-inc-opac': 'E',
        'hk-dec-opac': 'D',
      },
    });
  });
  return res;
}

function asAccountsV8(accountsV7: AccountV7[]): AccountV8[] {
  const res: AccountV8[] = [];
  accountsV7.forEach((acc) => {
    res.push({
      uid: acc.uid,
      token: acc.token,
      nick: acc.nick,
      overlay: acc.overlay,
      player: acc.player,
      overlaySettings: acc.overlaySettings,
      hotkeysSettings: acc.hotkeysSettings,
      game: 'mtga',
    });
  });
  return res;
}

function asAccountsV9(accountsV8: AccountV8[]): AccountV9[] {
  const res: AccountV9[] = [];
  accountsV8.forEach((acc) => {
    res.push({
      uid: acc.uid,
      token: acc.token,
      nick: acc.nick,
      overlay: acc.overlay,
      player: acc.player,
      overlaySettings: asOverlaySettingsV7(acc.overlaySettings),
      hotkeysSettings: acc.hotkeysSettings,
      game: 'mtga',
    });
  });
  return res;
}

function asAccountsV10(accountsV9: AccountV9[]): AccountV10[] {
  const res: AccountV10[] = [];
  accountsV9.forEach((acc) => {
    res.push({
      uid: acc.uid,
      token: acc.token,
      nick: acc.nick,
      overlay: acc.overlay,
      player: acc.player,
      overlaySettings: asOverlaySettingsV7(acc.overlaySettings),
      hotkeysSettings: {
        'hk-my-deck': acc.hotkeysSettings?.['hk-my-deck'] !== undefined ? acc.hotkeysSettings?.['hk-my-deck'] : 'Q',
        'hk-opp-deck': acc.hotkeysSettings?.['hk-opp-deck'] !== undefined ? acc.hotkeysSettings?.['hk-opp-deck'] : 'W',
        'hk-overlay': acc.hotkeysSettings?.['hk-overlay'] !== undefined ? acc.hotkeysSettings?.['hk-overlay'] : '`',
        'hk-inc-size': acc.hotkeysSettings?.['hk-inc-size'] !== undefined ? acc.hotkeysSettings?.['hk-inc-size'] : 'A',
        'hk-dec-size': acc.hotkeysSettings?.['hk-dec-size'] !== undefined ? acc.hotkeysSettings?.['hk-dec-size'] : 'S',
        'hk-inc-opac': acc.hotkeysSettings?.['hk-inc-opac'] !== undefined ? acc.hotkeysSettings?.['hk-inc-opac'] : 'E',
        'hk-dec-opac': acc.hotkeysSettings?.['hk-dec-opac'] !== undefined ? acc.hotkeysSettings?.['hk-dec-opac'] : 'D',
        'hk-restart-mtga': 'R',
      },
      game: 'mtga',
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

function migrateV4toV5(v4: SettingsV4): SettingsV5 {
  return {
    version: Version.v5,
    accounts: v4.accounts,
    userToken: v4.userToken,
    icon: v4.icon,
    autorun: v4.autorun,
    minimized: v4.minimized,
    overlay: v4.overlay,
    manualUpdate: v4.manualUpdate,
    awaiting: v4.awaiting,
    logPath: v4.logPath,
    nohotkeys: false,
    uploads: true,
  };
}

function migrateV5toV6(v5: SettingsV5): SettingsV6 {
  return {
    version: Version.v6,
    accounts: asAccountsV6(v5.accounts),
    userToken: v5.userToken,
    icon: v5.icon,
    autorun: v5.autorun,
    minimized: v5.minimized,
    overlay: v5.overlay,
    manualUpdate: v5.manualUpdate,
    awaiting: v5.awaiting,
    logPath: v5.logPath,
    nohotkeys: v5.nohotkeys,
    uploads: v5.uploads,
  };
}

function migrateV6toV7(v6: SettingsV6): SettingsV7 {
  return {
    version: Version.v7,
    accounts: asAccountsV6(v6.accounts),
    userToken: v6.userToken,
    icon: v6.icon,
    autorun: v6.autorun,
    minimized: v6.minimized,
    overlay: v6.overlay,
    manualUpdate: v6.manualUpdate,
    awaiting: v6.awaiting,
    logPath: v6.logPath,
    mtgaPath: undefined,
    nohotkeys: v6.nohotkeys,
    uploads: v6.uploads,
  };
}

function migrateV7toV8(v7: SettingsV7): SettingsV8 {
  return {
    version: Version.v8,
    accounts: asAccountsV7(v7.accounts),
    userToken: v7.userToken,
    icon: v7.icon,
    autorun: v7.autorun,
    minimized: v7.minimized,
    overlay: v7.overlay,
    manualUpdate: v7.manualUpdate,
    awaiting: v7.awaiting,
    logPath: v7.logPath,
    mtgaPath: v7.mtgaPath,
    nohotkeys: v7.nohotkeys,
    uploads: v7.uploads,
  };
}

function migrateV8toV9(v8: SettingsV8): SettingsV9 {
  return {
    version: Version.v9,
    accounts: asAccountsV8(v8.accounts),
    userToken: {mtga: v8.userToken},
    lastGame: 'mtga',
    icon: v8.icon,
    autorun: v8.autorun,
    minimized: v8.minimized,
    overlay: v8.overlay,
    manualUpdate: v8.manualUpdate,
    awaiting: v8.awaiting,
    logPath: v8.logPath,
    mtgaPath: v8.mtgaPath,
    nohotkeys: v8.nohotkeys,
    uploads: v8.uploads,
  };
}

function migrateV9toV10(v9: SettingsV9): SettingsV10 {
  return {
    version: Version.v10,
    accounts: asAccountsV9(v9.accounts),
    userToken: {mtga: v9.userToken?.mtga, lor: v9.userToken?.lor},
    lastGame: 'mtga',
    icon: v9.icon,
    autorun: v9.autorun,
    minimized: v9.minimized,
    overlay: v9.overlay,
    manualUpdate: v9.manualUpdate,
    awaiting: v9.awaiting,
    logPath: v9.logPath,
    mtgaPath: v9.mtgaPath,
    nohotkeys: v9.nohotkeys,
    uploads: v9.uploads,
  };
}

function migrateV10toV11(v10: SettingsV10): SettingsV11 {
  return {
    version: Version.v11,
    accounts: asAccountsV10(v10.accounts),
    userToken: {mtga: v10.userToken?.mtga, lor: v10.userToken?.lor},
    lastGame: 'mtga',
    icon: v10.icon,
    autorun: v10.autorun,
    minimized: v10.minimized,
    overlay: v10.overlay,
    manualUpdate: v10.manualUpdate,
    awaiting: v10.awaiting,
    logPath: v10.logPath,
    mtgaPath: v10.mtgaPath,
    nohotkeys: v10.nohotkeys,
    uploads: v10.uploads,
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
    case Version.v4:
      return parseSettings(migrateV4toV5(settings));
    case Version.v5:
      return parseSettings(migrateV5toV6(settings));
    case Version.v6:
      return parseSettings(migrateV6toV7(settings));
    case Version.v7:
      return parseSettings(migrateV7toV8(settings));
    case Version.v8:
      return parseSettings(migrateV8toV9(settings));
    case Version.v9:
      return parseSettings(migrateV9toV10(settings));
    case Version.v10:
      return parseSettings(migrateV10toV11(settings));
    default:
      return settings;
  }
}

function createDefault(): LatestSettings {
  return parseSettings({version: Version.v0});
}

export const settingsStore = new SettingsStore();
