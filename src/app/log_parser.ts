import {sendEventsToServer} from 'root/api/logsender';
import {LogParser2} from 'root/app/log-parser/logparser2';
import {sendMessageToHomeWindow, sendMessageToOverlayWindow} from 'root/app/messages';
import {settingsStore} from 'root/app/settings_store';
import {error} from 'root/lib/logger';

export type MaybeLogParser2 = LogParser2 | undefined;
let logParser: MaybeLogParser2;

export function getLogParser(): LogParser2 | undefined {
  return logParser;
}

export function withLogParser(fn: (logParser: LogParser2) => void): void {
  if (logParser === undefined) {
    return;
  }
  fn(logParser);
}

export function createLogParser(logpath?: string, parseOnce?: boolean): LogParser2 {
  const defaultpath = ['LocalLow', 'Wizards Of The Coast', 'MTGA', 'output_log.txt'];
  const specialpath = settingsStore.get().logPath;
  logParser = new LogParser2(
    logpath !== undefined ? logpath : specialpath !== undefined ? specialpath : defaultpath,
    specialpath !== undefined || logpath !== undefined,
    parseOnce
  );

  logParser.emitter.on('newdata', data => {
    if (data.events.length > 0) {
      const userToken = settingsStore.get().userToken;
      if (userToken !== undefined && userToken.includes('SKIPPING')) {
        sendMessageToHomeWindow('show-status', {message: 'Skipping this account...', color: '#dbb63d'});
        return;
      }
      sendEventsToServer(data.events, data.parsingMetadata.logSender, data.state);
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

  if (!parseOnce && settingsStore.get().overlay) {
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
