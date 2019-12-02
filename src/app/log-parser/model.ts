export type LogFileOperationResult<T> = [T, number];

export interface RawLogEvent {
  event: string;
  rawData: any;
  data: any;
}

// '<== PlayerInventory.GetPlayerInventory', // marker 0
// '<== PlayerInventory.GetPlayerCardsV3', // marker 1
// '<== Deck.GetDeckListsV3', // marker 2
// '<== Event.DeckSubmitV3', // marker 3
// '<== PlayerInventory.CrackBoostersV3', // marker 6 ???
// '<== Draft.DraftStatus', // marker 7 ???
// '==> Draft.MakePick', // marker 8 ???
// '<== Draft.MakePick', // marker 9 ???
// '<== Event.GetPlayerCourseV2', // marker 10 ???
// '==> DirectGame.Challenge', // marker 11 ???
// '==> Event.MatchCreated', // marker 12
// '<== Event.GetCombinedRankInfo', // marker 14
// '<== Event.GetActiveEventsV2', // marker 15 XXX
// '==> Inventory.Updated', // marker 17 ???
// '<== Quest.GetPlayerQuests', // marker 19
// '==> PostMatch.Update', // marker 20
// '==> Log.BI', // marker 21 XXX
// '<== PlayerInventory.GetFormats', // marker 22
// 'MatchGameRoomStateChangedEvent /// matchGameRoomStateChangedEvent', // marker 4
// 'GreToClientEvent /// gameObjects', // marker 5
// 'GreToClientEvent /// gameInfo', // marker 13
// 'GreToClientEvent /// mulliganReq', // marker 16
// 'GreToClientEvent /// turnInfo', // marker 18

export interface ParsingMetadata {
  batchInterval: number;
  detailedLogInfo: DetailedLogParsingMetadata;
  fileId: FileIdParsingMetadata;
  events: EventParsingMetadata[];
  eventPrefix: string; // '[UnityCrossThreadLogger]'
}

export interface DetailedLogParsingMetadata {
  prefix: string; // 'DETAILED LOGS:'
  enabledValue: string; // 'ENABLED'
  disabledValue: string; // 'DISABLED'
}

export interface FileIdParsingMetadata {
  eventName: string; // '==> Authenticate'
  attributesPathToId: string[]; // ['params', 'ticket']
}

export interface EventParsingMetadata {
  name: string; // '<== PlayerInventory.GetPlayerInventory'
}

export const parsingMetadata: ParsingMetadata = {
  batchInterval: 2000,
  detailedLogInfo: {
    prefix: 'DETAILED LOGS:',
    enabledValue: 'ENABLED',
    disabledValue: 'DISABLED',
  },
  fileId: {
    eventName: '==> Authenticate',
    attributesPathToId: ['params', 'ticket'],
  },
  events: [],
  eventPrefix: '[UnityCrossThreadLogger]',
};

const eventWhitelist = [
  '<== PlayerInventory.GetPlayerInventory',
  '<== PlayerInventory.GetPlayerCardsV3',
  '<== Deck.GetDeckListsV3',
  '<== Event.DeckSubmitV3',
  '<== PlayerInventory.CrackBoostersV3',
  '<== Draft.DraftStatus',
  '==> Draft.MakePick',
  '<== Draft.MakePick',
  '<== Event.GetPlayerCourseV2',
  '==> DirectGame.Challenge',
  '==> Event.MatchCreated',
  '<== Event.GetCombinedRankInfo',
  '<== Event.GetActiveEventsV2',
  '==> Inventory.Updated',
  '<== Quest.GetPlayerQuests',
  '==> PostMatch.Update',
  '==> Log.BI',
  '<== PlayerInventory.GetFormats',
  'MatchGameRoomStateChangedEvent',
  'GreToClientEvents',
];
