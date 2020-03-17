import {LogParserParsingMetadata, LogSenderParsingMetadata} from 'root/app/log-parser/model';

export type LOROperationResult<T> = [T, LORParsingState];

export interface LORParsingState {
  timestamp?: number;
  matchId?: string;
  screenName?: string;
}

export interface LORRawLogEvent {
  name: string;
  rawData: any; // tslint:disable-line:no-any
  data: any; // tslint:disable-line:no-any
}

export interface LORLogEvent extends LORRawLogEvent {
  indicator?: number;
}

export interface StatefulLogEvent extends LORLogEvent {
  timestamp?: number;
  matchId?: string;
}

export interface LorParsingMetadata {
  logSender: LogSenderParsingMetadata;
  logParser: LogParserParsingMetadata;
  events: LorEventParsingMetadata[];
}

export interface LorEventParsingMetadata {
  name: string; // Name of the event in the logs
  indicator?: number; // If defined, indicate we need to send this event to the server with the sepcified indicator
}

export interface LorStateInfo {
  lastEndpoint: number;
  lastGameState: string;
  excludeEndpoints: number[];
  delayEndpoints: number[];
  currentDelays: number[];
}
