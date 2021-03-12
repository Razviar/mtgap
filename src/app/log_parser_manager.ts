import {app} from 'electron';
import {stat, statSync, writeFileSync} from 'fs';
import {basename, join} from 'path';
import {promisify} from 'util';

import {sendEventsToServer} from 'root/api/logsender';
import {checkDetailedLogEnabled} from 'root/app/log-parser/detailed_log';
import {getEvents} from 'root/app/log-parser/events';
import {getUserCredentials} from 'root/app/log-parser/getusercredentials';
import {LogParser} from 'root/app/log-parser/log_parser';
import {LogFileParsingState, ParsingMetadata, StatefulLogEvent} from 'root/app/log-parser/model';
import {sendMessageToHomeWindow, sendMessageToOverlayWindow} from 'root/app/messages';
import {oldStore} from 'root/app/old_store';
import {settingsStore} from 'root/app/settings-store/settings_store';
import {getAccountFromScreenName} from 'root/app/userswitch';
import {error} from 'root/lib/logger';
import {asMap, removeUndefined} from 'root/lib/type_utils';
import {sleep} from 'root/lib/utils';
import electronIsDev from 'electron-is-dev';

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

export function createGlobalLogParser(dev?: boolean): LogParser {
  logParser = new LogParser();

  logParser.emitter.on('newdata', (data) => {
    if (data.events.length > 0) {
      const userToken = settingsStore.get().userToken?.mtga;
      if (userToken !== undefined && userToken.includes('SKIPPING')) {
        sendMessageToHomeWindow('show-status', {message: 'Skipping this account...', color: '#dbb63d'});
        return;
      }
      if (dev) {
        //console.log(data.events);
        console.log('There will be sent this number of events: ', data.events.length);
        if (data && data.events && data.events[0]) {
          console.log('This is user ID:', data.events[0].uid);
        }
        console.log(data.events.filter((ev) => ev.indicator === 15));
      }
      sendEventsToServer(data.events, data.parsingMetadata.logSender, data.state, data.fileId);
    }
  });

  logParser.emitter.on('error', (msg) => {
    sendMessageToHomeWindow('show-status', {message: msg, color: '#cc2d2d'});
  });

  logParser.emitter.on('status', (msg) => {
    sendMessageToHomeWindow('show-status', {message: msg, color: '#22a83a'});
  });

  logParser.emitter.on('deck-submission', (msg) => {
    if (settingsStore.get().overlay) {
      sendMessageToOverlayWindow('deck-submission', msg);
    }
  });

  logParser.emitter.on('deck-message', (msg) => {
    if (settingsStore.get().overlay) {
      sendMessageToOverlayWindow('deck-message', msg);
    }
  });

  logParser.emitter.on('match-started', (msg) => {
    //console.log('match-started-recieved!');
    const account = settingsStore.getAccount();
    if (account && settingsStore.get().overlay) {
      sendMessageToOverlayWindow('match-started', {...msg, uid: account.uid});
    }
  });
  logParser.emitter.on('card-played', (msg) => {
    if (settingsStore.get().overlay) {
      sendMessageToOverlayWindow('card-played', msg);
    }
  });
  logParser.emitter.on('mulligan', (msg) => {
    if (settingsStore.get().overlay) {
      sendMessageToOverlayWindow('mulligan', msg);
    }
  });
  logParser.emitter.on('match-over', () => {
    if (settingsStore.get().overlay) {
      sendMessageToOverlayWindow('match-over', undefined);
    }
  });

  logParser.emitter.on('turn-info', (dp) => {
    sendMessageToOverlayWindow('turn-info', dp);
  });

  logParser.emitter.on('draft-turn', (msg) => {
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

  logParser.emitter.on('nologfile', () => {
    sendMessageToHomeWindow('nologfile', undefined);
  });

  if (electronIsDev) {
    console.log('Starting parser from Global...');
  }

  logParser.start().catch((err) => {
    error('Failure to start parser', err);
  });

  return logParser;
}

export async function parseOldLogs(
  logpath: string,
  parsingMetadata: ParsingMetadata,
  nextState?: LogFileParsingState,
  dev?: boolean,
  forceUpload?: boolean
): Promise<number> {
  // Check that file exists
  await promisify(stat)(logpath);

  let currentState: LogFileParsingState;
  if (!nextState) {
    // Detecting detailed logs
    try {
      const fileCTime = statSync(logpath).ctime;
      const [detailedLogEnabled, detailedLogState] = await checkDetailedLogEnabled(logpath, parsingMetadata);
      const [userCreds] = await getUserCredentials(logpath, {bytesRead: 0}, parsingMetadata);
      if (userCreds.DisplayName === undefined) {
        return 1;
      }
      if (!dev) {
        if (getAccountFromScreenName(userCreds.DisplayName) === undefined) {
          return 1;
        }
      }
      if (!detailedLogEnabled) {
        return 1;
      }
      const fileId = basename(logpath);
      if (oldStore.checkLog(fileId, logpath)) {
        return 1;
      }
      if (!dev) {
        oldStore.saveFileID(fileCTime.getTime(), fileId);
        oldStore.saveLogName(fileCTime.getTime(), logpath);
      }
      currentState = detailedLogState;
      currentState.screenName = userCreds.DisplayName;
      currentState.userId = userCreds.AccountID;
      currentState.timestamp = fileCTime.getTime();
    } catch (olde) {
      return 1;
    }
  } else {
    currentState = nextState;
  }

  // Parsing events
  const [events, newState] = await getEvents(logpath, currentState, parsingMetadata, true);

  /*console.log(events);
  console.log(newState);*/
  // Check if end of parsing
  if (events.length === 0) {
    return 0;
  }

  if (dev) {
    console.log(events);
  }

  // Filter useless events
  const eventsToSend = removeUndefined(
    events.map((e) => {
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
        turnNumber: e.turnNumber === undefined ? 0 : e.turnNumber,
        lifeTotals: e.lifeTotals === undefined ? {pl1: 0, pl2: 0} : e.lifeTotals,
      };
    })
  );

  // Send events to server

  if (dev) {
    //console.log(eventsToSend);
    if (forceUpload) {
      //console.log('doing force upload');
      //console.log(eventsToSend);
      sendEventsToServer(eventsToSend, parsingMetadata.logSender, newState, undefined, forceUpload);
    } else {
      //console.log(eventsToSend);
      eventsToSend.forEach((writeEvent) => {
        const path = join(app.getPath('userData'), 'ParsedLogs', `parsed-data-${writeEvent.indicator}.json`);
        writeFileSync(path, JSON.stringify(writeEvent), {flag: 'a'});
      });
    }
  } else {
    sendEventsToServer(eventsToSend, parsingMetadata.logSender, newState);
  }

  // Adding small sleep
  await sleep(100);

  // Triggering next batch
  return parseOldLogs(logpath, parsingMetadata, newState, dev, forceUpload);
}
