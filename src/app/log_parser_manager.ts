import {stat, statSync} from 'fs';
import {promisify} from 'util';

import {sendEventsToServer} from 'root/api/logsender';
import {checkDetailedLogEnabled} from 'root/app/log-parser/detailed_log';
import {getEvents} from 'root/app/log-parser/events';
import {LogParser} from 'root/app/log-parser/log_parser';
import {LogFileParsingState, ParsingMetadata, StatefulLogEvent} from 'root/app/log-parser/model';
import {extractValue} from 'root/app/log-parser/parsing';
import {sendMessageToHomeWindow, sendMessageToOverlayWindow} from 'root/app/messages';
import {settingsStore} from 'root/app/settings-store/settings_store';
import {getAccountFromScreenName} from 'root/app/userswitch';
import {error} from 'root/lib/logger';
import {asMap, asString, removeUndefined} from 'root/lib/type_utils';
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

  logParser.emitter.on('deck-submission', msg => {
    if (settingsStore.get().overlay) {
      sendMessageToOverlayWindow('deck-submission', msg);
    }
  });
  logParser.emitter.on('match-started', msg => {
    //console.log('match-started-recieved!');
    const account = settingsStore.getAccount();
    if (account && settingsStore.get().overlay) {
      sendMessageToOverlayWindow('match-started', {...msg, uid: account.uid});
    }
  });
  logParser.emitter.on('card-played', msg => {
    if (settingsStore.get().overlay) {
      sendMessageToOverlayWindow('card-played', msg);
    }
  });
  logParser.emitter.on('mulligan', msg => {
    if (settingsStore.get().overlay) {
      sendMessageToOverlayWindow('mulligan', msg);
    }
  });
  logParser.emitter.on('match-over', () => {
    if (settingsStore.get().overlay) {
      sendMessageToOverlayWindow('match-over', undefined);
    }
  });

  logParser.emitter.on('turn-info', dp => {
    const account = settingsStore.getAccount();
    if (account?.overlaySettings?.timers) {
      sendMessageToOverlayWindow('turn-info', dp);
    }
  });

  logParser.emitter.on('draft-turn', msg => {
    //console.log('match-started-recieved!');
    const account = settingsStore.getAccount();
    if (account && settingsStore.get().overlay) {
      sendMessageToOverlayWindow('draft-turn', msg);
    }
  });

  logParser.emitter.on('draft-complete', () => {
    //console.log('match-started-recieved!');
    const account = settingsStore.getAccount();
    if (account && settingsStore.get().overlay) {
      sendMessageToOverlayWindow('draft-complete', undefined);
    }
  });

  logParser.start().catch(err => {
    error('Failure to start parser', err);
  });

  return logParser;
}

export async function parseOldLogs(
  logpath: string,
  parsingMetadata: ParsingMetadata,
  nextState?: LogFileParsingState
): Promise<number> {
  // Check that file exists
  await promisify(stat)(logpath);

  let currentState: LogFileParsingState;
  if (!nextState) {
    // Detecting detailed logs
    const [detailedLogEnabled, detailedLogState] = await checkDetailedLogEnabled(logpath, parsingMetadata);
    if (!detailedLogEnabled) {
      return 1;
    }
    currentState = detailedLogState;
  } else {
    currentState = nextState;
  }

  // Parsing events
  const fileCTime = statSync(logpath).ctime;
  currentState.timestamp = fileCTime.getTime();
  const [events, newState] = await getEvents(logpath, currentState, parsingMetadata, true);
  /*console.log(events);
  console.log(newState);*/
  // Check if end of parsing
  if (events.length === 0) {
    return 0;
  }

  for (const event of events) {
    switch (event.name) {
      case parsingMetadata.userChangeEvent:
        if (handleUserChangeEvent(event)) {
          return 2;
        }
        break;
    }
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
  // console.log(eventsToSend);
  sendEventsToServer(eventsToSend, parsingMetadata.logSender, newState);

  // Adding small sleep
  await sleep(100);

  // Triggering next batch
  return parseOldLogs(logpath, parsingMetadata, newState);
}

function handleUserChangeEvent(event: StatefulLogEvent): boolean {
  const settings = settingsStore.get();
  const newPlayerId = asString(extractValue(event.data, ['params', 'payloadObject', 'playerId']));
  const language = asString(extractValue(event.data, ['params', 'payloadObject', 'settings', 'language', 'language']));
  const screenName = asString(extractValue(event.data, ['params', 'payloadObject', 'screenName']));
  if (newPlayerId === undefined || language === undefined || screenName === undefined) {
    error('Encountered invalid user change event', undefined, {...event});
    return false;
  }
  const newAccount = getAccountFromScreenName(screenName);
  if (newAccount === undefined) {
    sendMessageToHomeWindow('set-screenname', {screenName, newPlayerId});
    sendMessageToHomeWindow('new-account', undefined);
    sendMessageToHomeWindow('show-prompt', {
      message: 'New MTGA account found in the old logs! Please Skip or Sync it and repeat old logs scanning...',
      autoclose: 1000,
    });
    settings.awaiting = {playerId: newPlayerId, screenName, language};
    settingsStore.save();
    return true;
  }
  return false;
}
