export type LogFileOperationResult<T> = [T, LogFileParsingState];

export interface LogFileParsingState {
  bytesRead: number;
  timestamp?: number;
  userId?: string;
  matchId?: string;
}

export interface RawLogEvent {
  name: string;
  rawData: any; // tslint:disable-line:no-any
  data: any; // tslint:disable-line:no-any
}

export interface LogEvent extends RawLogEvent {
  indicator?: number;
}

export interface StatefulLogEvent extends LogEvent {
  timestamp?: number;
  userId?: string;
  matchId?: string;
}

export interface ParsingMetadata {
  logSender: LogSenderParsingMetadata;
  logParser: LogParserParsingMetadata;
  detailedLogInfo: DetailedLogParsingMetadata;
  fileId: FileIdParsingMetadata;
  events: EventParsingMetadata[];
  eventPrefix: string; // '[UnityCrossThreadLogger]'
  userChangeEvent: string;
  matchStartEvent: string;
  matchEndEvent: string;
  cardPlayedEvent: string;
  deckSubmittedEvent: string;
}

export interface LogSenderParsingMetadata {
  fastTimeout: number;
  slowTimeout: number;
  batchSize: number;
}

export interface LogParserParsingMetadata {
  readTimeout: number;
  batchSize: number;
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

// Describe how to extract a new sub event from a parent event
export interface SplitEventParsingMetadata {
  subEventName: string; // name of the sub event
  attributesPath: string[]; // path of attributes describing where to find the data of the sub event in the parent event
}

export interface MultiEventParsingMetadata {
  subEventName: string; // name each sub events once split
  attributesPath: string[]; // path of attributes to an array of sub events
}

export interface EventConstraint {
  attributesPath: (number | string)[];
  value: any; // tslint:disable-line:no-any
}

export interface EventParsingMetadata {
  name: string; // Name of the event in the logs
  newName?: string; // If defined, rename the event
  indicator?: number; // If defined, indicate we need to send this event to the server with the sepcified indicator
  renamer?: string[]; // If defined, describe the path of attributes to find the real name of the event
  multiEvents?: MultiEventParsingMetadata; // If defined, indicate that the event is actually an array of sub events
  subEvents?: SplitEventParsingMetadata[]; // If defined, describe how to split the data of the event in sub events
  constraint?: EventConstraint; // If defined, check the value of an attribute of the event before saving it
}

export const parsingMetadata: ParsingMetadata = {
  logSender: {
    fastTimeout: 1000,
    slowTimeout: 5000,
    batchSize: 50,
  },
  logParser: {
    readTimeout: 500,
    batchSize: 50,
  },
  detailedLogInfo: {
    prefix: 'DETAILED LOGS:',
    enabledValue: 'ENABLED',
    disabledValue: 'DISABLED',
  },
  fileId: {
    eventName: '==> Authenticate',
    attributesPathToId: ['params', 'ticket'],
  },
  userChangeEvent: 'Client.Connected',
  deckSubmittedEvent: 'DuelScene.GameStart',
  matchStartEvent: 'DuelScene.GameStart',
  matchEndEvent: 'DuelScene.EndOfMatchReport',
  cardPlayedEvent: 'CardPlayed',
  events: [
    {name: '==> Log.BI', renamer: ['params', 'messageName']},
    {
      name: 'GreToClientEvent',
      multiEvents: {attributesPath: ['greToClientMessages'], subEventName: 'GreToClientEventMessage'},
    },
    {
      name: 'GreToClientEventMessage',
      subEvents: [
        {attributesPath: ['gameStateMessage', 'gameObjects'], subEventName: 'GameObjects'},
        {attributesPath: ['gameStateMessage', 'gameInfo'], subEventName: 'GameInfo'},
        {attributesPath: ['mulliganReq'], subEventName: 'MulliganReq'},
        {attributesPath: ['gameStateMessage', 'turnInfo'], subEventName: 'TurnInfo'},
      ],
    },
    {
      name: 'MatchGameRoomStateChangedEvent',
      subEvents: [{attributesPath: [], subEventName: 'MatchGameRoomStateChangedEventSubInfo'}],
    },
    {
      name: 'GameObjects',
      constraint: {attributesPath: [0, 'type'], value: 'GameObjectType_Card'},
      multiEvents: {attributesPath: [], subEventName: 'CardPlayed'},
      indicator: 5,
    },
    {name: '<== PlayerInventory.GetPlayerInventory', indicator: 0},
    {name: '<== PlayerInventory.GetPlayerCardsV3', indicator: 1},
    {name: '<== Deck.GetDeckListsV3', indicator: 2},
    {name: '<== Event.DeckSubmitV3', indicator: 3},
    {name: 'MatchGameRoomStateChangedEventSubInfo', indicator: 4},
    {name: 'CardPlayed'},
    {name: '<== PlayerInventory.CrackBoostersV3'}, // Useless?
    {name: '<== Draft.DraftStatus', indicator: 7},
    {name: '==> Draft.MakePick', indicator: 8},
    {name: '<== Draft.MakePick', indicator: 9},
    {name: '<== Event.GetPlayerCourseV2', indicator: 10},
    {name: '==> DirectGame.Challenge', indicator: 11},
    {name: '==> Event.MatchCreated', indicator: 12},
    {name: 'GameInfo', indicator: 13},
    {name: '<== Event.GetCombinedRankInfo', indicator: 14},
    {name: '<== Event.GetActiveEventsV2'}, // Useless?
    {name: 'MulliganReq', indicator: 16},
    {name: '==> Inventory.Updated', indicator: 17},
    {name: 'TurnInfo', indicator: 18, constraint: {attributesPath: ['turnNumber'], value: 1}},
    {name: '<== Quest.GetPlayerQuests', indicator: 19},
    {name: '==> PostMatch.Update', indicator: 20},
    {name: '<== PlayerInventory.GetFormats', indicator: 22},
    {name: 'Client.Connected'},
    {name: 'DuelScene.GameStart'},
    {name: 'DuelScene.EndOfMatchReport'},
  ],
  eventPrefix: '[UnityCrossThreadLogger]',
};
