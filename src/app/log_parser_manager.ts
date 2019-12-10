import {stat} from 'fs';
import {promisify} from 'util';

import {sendEventsToServer} from 'root/api/logsender';
import {checkDetailedLogEnabled} from 'root/app/log-parser/detailed_log';
import {getEvents} from 'root/app/log-parser/events';
import {LogParser} from 'root/app/log-parser/log_parser';
import {LogFileParsingState, ParsingMetadata} from 'root/app/log-parser/model';
import {sendMessageToHomeWindow, sendMessageToOverlayWindow} from 'root/app/messages';
import {settingsStore} from 'root/app/settings_store';
import {error} from 'root/lib/logger';
import {asMap, removeUndefined} from 'root/lib/type_utils';
import {sleep} from 'root/lib/utils';

export type MaybeLogParser = LogParser | undefined;
let logParser: MaybeLogParser;

export function getLogParser(): LogParser | undefined {
  return logParser;
}

export function withLogParser(fn: (logParser: LogParser) => void): void {
  if (logParser === undefined) {
    return;
  }
  fn(logParser);
}

export function createGlobalLogParser(): LogParser {
  logParser = new LogParser();

  logParser.emitter.on('newdata', data => {
    if (data.events.length > 0) {
      const userToken = settingsStore.get().userToken;
      if (userToken !== undefined && userToken.includes('SKIPPING')) {
        sendMessageToHomeWindow('show-status', {message: 'Skipping this account...', color: '#dbb63d'});
        return;
      }
      sendEventsToServer(data.events, data.parsingMetadata.logSender, data.state, data.fileId);
    }
  });

  logParser.emitter.on('language', data => {
    const account = settingsStore.getAccount();
    if (account !== undefined && account.player) {
      account.player.language = data;
      settingsStore.save();
    }
  });

  logParser.emitter.on('error', msg => {
    sendMessageToHomeWindow('show-status', {message: msg, color: '#cc2d2d'});
  });

  logParser.emitter.on('status', msg => {
    sendMessageToHomeWindow('show-status', {message: msg, color: '#22a83a'});
  });

  if (settingsStore.get().overlay) {
    logParser.emitter.on('deck-submission', msg => sendMessageToOverlayWindow('deck-submission', msg));
    logParser.emitter.on('match-started', msg => {
      const account = settingsStore.getAccount();
      if (account) {
        sendMessageToOverlayWindow('match-started', {...msg, uid: account.uid});
      }
    });
    logParser.emitter.on('card-played', msg => sendMessageToOverlayWindow('card-played', msg));
    logParser.emitter.on('mulligan', msg => sendMessageToOverlayWindow('mulligan', msg));
    logParser.emitter.on('match-over', () => sendMessageToOverlayWindow('match-over', undefined));
  }

  logParser.start().catch(err => {
    error('Failure to start parser', err);
  });

  return logParser;
}

export async function parseOldLogs(
  logpath: string,
  parsingMetadata: ParsingMetadata,
  nextState?: LogFileParsingState
): Promise<void> {
  // Check that file exists
  await promisify(stat)(logpath);

  let currentState: LogFileParsingState;
  if (!nextState) {
    // Detecting detailed logs
    const [detailedLogEnabled, detailedLogState] = await checkDetailedLogEnabled(logpath, parsingMetadata);
    if (!detailedLogEnabled) {
      throw new Error('Enable Detailed Logs!');
    }
    currentState = detailedLogState;
  } else {
    currentState = nextState;
  }

  // Parsing events
  const [events, newState] = await getEvents(logpath, currentState, parsingMetadata);

  // Check if end of parsing
  if (events.length === 0) {
    return;
  }

  // Filter useless events
  const eventsToSend = removeUndefined(
    events.map(e => {
      if (e.indicator === undefined) {
        return undefined;
      }
      const payload = asMap(e.rawData, {}).payload;
      const json = JSON.stringify(payload === undefined ? e.rawData : payload);
      return {
        time: e.timestamp === undefined ? 1 : e.timestamp,
        indicator: e.indicator,
        json,
        uid: e.userId === undefined ? '' : e.userId,
        matchId: e.matchId === undefined ? '' : e.matchId,
      };
    })
  );

  // Send events to server
  sendEventsToServer(eventsToSend, parsingMetadata.logSender, newState);

  // Adding small sleep
  await sleep(100);

  // Triggering next batch
  return parseOldLogs(logpath, parsingMetadata, newState);
}
