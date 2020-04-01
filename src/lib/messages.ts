import {TokenCheckRes, TokenRequestRes} from 'root/api/userbytokenid';
import {Account, LatestSettings, OverlaySettings} from 'root/app/settings-store/settings_store';
import {HotkeysSettingsV1} from 'root/app/settings-store/v8';
import {CardPlayed} from 'root/models/cards';
import {Metadata, UserMetadata} from 'root/models/metadata';
import {UserResult} from 'root/models/userbytokenid';

export interface Messages {
  'start-sync': {currentMtgaNick: string; currentMtgaID: string};
  'lor-start-sync': undefined;
  'sync-process': TokenRequestRes;
  'lor-sync-process': TokenRequestRes;
  'token-waiter': string;
  'need-reset-sync': undefined;
  'lor-token-waiter': string;
  'token-waiter-responce': {
    res: TokenCheckRes | undefined;
    request: string;
  };
  'lor-token-waiter-responce': {
    res: TokenCheckRes | undefined;
    request: string;
  };
  'do-shadow-sync': undefined;
  'get-userbytokenid': string;
  'userbytokenid-responce': UserResult;
  'open-link': string;
  'token-input': Account;
  'minimize-me': undefined;
  'set-settings': LatestSettings;
  'set-o-settings': OverlaySettings;
  'kill-current-token': undefined;
  'set-log-path': undefined;
  'default-log-path': undefined;
  'set-mtga-path': undefined;
  'default-mtga-path': undefined;
  'old-log': undefined;
  'wipe-all': undefined;
  'wipe-position': undefined;
  'restart-me': undefined;
  'check-updates': undefined;
  'stop-tracker': undefined;
  'apply-update': undefined;
  'set-creds': {
    account: Account;
    source: string;
  };
  'show-prompt': {message: string; autoclose: number};
  'new-account': undefined;
  'show-status': {color: string; message: string};
  'set-screenname': {screenName: string; newPlayerId: string};
  'match-started': {
    matchId: string;
    uid: string;
    seatId: number;
    eventId: string;
    gameNumber: number;
  };
  'enable-clicks': undefined;
  'disable-clicks': undefined;
  'deck-submission': {
    commandZoneGRPIds: number[];
    mainDeck: {[index: number]: number};
    deckName: string;
    deckId: string;
    InternalEventName: string;
  };
  'set-metadata': Metadata;
  'set-userdata': UserMetadata;
  mulligan: boolean;
  'set-version': string;
  'show-update-button': string;
  'set-setting-autorun': boolean;
  'set-setting-minimized': boolean;
  'set-setting-manualupdate': boolean;
  'set-setting-overlay': boolean;
  'set-setting-icon': string;
  'set-setting-do-uploads': boolean;
  'set-setting-disable-hotkeys': boolean;
  'match-over': undefined;
  'card-played': CardPlayed;
  'set-setting-o-hidezero': boolean;
  'set-setting-o-hidemy': boolean;
  'set-setting-o-hideopp': boolean;
  'set-setting-o-showcardicon': boolean;
  'set-setting-o-leftdigit': number;
  'set-setting-o-rightdigit': number;
  'set-setting-o-leftdraftdigit': number;
  'set-setting-o-rightdraftdigit': number;
  'set-setting-o-bottomdigit': number;
  'set-setting-o-neverhide': boolean;
  'set-setting-o-mydecks': boolean;
  'set-setting-o-cardhover': boolean;
  'set-setting-o-timers': boolean;
  'set-setting-o-savepositiontop': number;
  'set-setting-o-savepositionleft': number;
  'set-setting-o-savepositiontopopp': number;
  'set-setting-o-savepositionleftopp': number;
  'set-setting-o-savescale': number;
  'set-setting-o-opacity': number;
  'set-setting-o-fontcolor': number;
  'set-setting-o-detach': boolean;
  'set-setting-o-hidemain': boolean;
  'hk-my-deck': string;
  'hk-opp-deck': string;
  'hk-overlay': string;
  'hk-inc-size': string;
  'hk-dec-size': string;
  'hk-inc-opac': string;
  'hk-dec-opac': string;
  'set-hotkey-map': HotkeysSettingsV1 | undefined;
  'network-status': {
    active: boolean;
    message: NetworkStatusMessage;
    eventsleft?: number;
  };
  'set-icosettings': string | undefined;
  'set-scale': number;
  'set-zoom': number;
  'draft-turn': {
    DraftPack: number[];
    PackNumber: number;
    PickNumber: number;
  };
  'set-ovlsettings': OverlaySettings | undefined;
  'draft-complete': undefined;
  'turn-info': {decisionPlayer: number; turnNumber?: number};
  'error-in-renderer': {
    error: string | Event;
    url: string | undefined;
    line: number | undefined;
  };
  'toggle-me': undefined;
  'toggle-opp': undefined;
  'toggle-all': undefined;
  'scale-up': undefined;
  'scale-down': undefined;
  'opacity-up': undefined;
  'opacity-down': undefined;
  'stop-shadow-sync': undefined;
  'shadow-sync-over': undefined;
  nologfile: undefined;
  'game-switch': 'lor' | 'mtga';
}

export enum NetworkStatusMessage {
  'DownloadingUpdates' = 'Preparing updates...',
  'CheckingUpdates' = 'Checking for updates...',
  'Connected' = 'Connected to server',
  'Disconnected' = 'Error connecting to server',
  'SendingEvents' = 'Sending events to server...',
}

export type Message = keyof Messages;
export type MessageCallback<M extends Message> = (data: Messages[M]) => void;

export interface MessagePayload<M extends Message> {
  message: M;
  data: Messages[M];
}

export function onMessageGeneric<M extends Message>(
  allCallbacks: Map<Message, MessageCallback<Message>[]>,
  message: M,
  cb: MessageCallback<M>
): void {
  if (!allCallbacks.has(message)) {
    allCallbacks.set(message, []);
  }
  const callbacks = allCallbacks.get(message) as MessageCallback<M>[];
  callbacks.push(cb);
}

export function onBridgeMessageGeneric<M extends Message>(
  allCallbacks: Map<Message, MessageCallback<Message>[]>,
  // tslint:disable-next-line: no-any
  data: any
): void {
  const payload = data as MessagePayload<M>;
  const callbacks = allCallbacks.get(payload.message);
  if (callbacks !== undefined) {
    for (const cb of callbacks) {
      cb(payload.data);
    }
  }
}
