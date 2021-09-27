export type LogFileOperationResult<T> = [T, LogFileParsingState];

export interface LogFileParsingState {
  bytesRead: number;
  timestamp?: number;
  userId?: string;
  matchId?: string;
  screenName?: string;
  turnNumber?: number;
  lifeTotals?: {pl1?: number; pl2?: number};
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
  turnNumber?: number;
  lifeTotals?: {pl1?: number; pl2?: number};
}

export interface ParsingMetadata {
  logSender: LogSenderParsingMetadata;
  logParser: LogParserParsingMetadata;
  detailedLogInfo: DetailedLogParsingMetadata;
  userLoginData: UserLoginDataParsingMetadata;
  fileId: FileIdParsingMetadata;
  events: EventParsingMetadata[];
  eventPrefix: string; // '[UnityCrossThreadLogger]'
  eventPrefixExtra: string; // '[MTGA.Pro Logger]'
  accountPrefix: string;
  screenNamePrefix: string;
  userChangeEvent: string;
  matchStartEvent: string;
  AIPracticeDeckSubmit: string;
  deckMessage: string;
  matchCreatedEvent: string;
  matchEndEvent: string;
  mulliganEvent: string;
  cardPlayedEvent: string;
  deckSubmissionEvent: string;
  draftStartEvent: string;
  draftMakePickEvent: string;
  draftPickResponseEvent: string;
  humanDraftEvent: string;
  humanDraftPick: string;
  TurnInfoAllEvent: string;
  PlayersInfoEvent: string;
  GameBackupClosureEvent: string;
  GameClosureEvent: string;
}

export interface LogSenderParsingMetadata {
  fastTimeout: number;
  slowTimeout: number;
  batchSize: number;
  sendingRates: {[indicator: number]: number};
  sendOnlyTheLast: {[indicator: number]: number};
  forceUpload?: boolean;
}

export interface LogParserParsingMetadata {
  readTimeout: number;
  batchSize: number;
}

export interface UserLoginDataParsingMetadata {
  prefix: string;
  userName: string;
  userID: string;
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
  fireevents?: boolean;
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
