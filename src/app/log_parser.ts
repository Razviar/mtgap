import {app} from 'electron';

import {uploadpackfile} from 'root/api/logsender';
import {setuserdata, UserData} from 'root/api/userbytokenid';
import {setCreds} from 'root/app/auth';
import {LogParser} from 'root/app/logparser';
import {sendMessageToHomeWindow, sendMessageToOverlayWindow} from 'root/app/messages';
import {connectionWaiter} from 'root/app/process_watcher';
import {settingsStore} from 'root/app/settings_store';
import {getAccountFromScreenName} from 'root/app/userswitch';
import {error} from 'root/lib/logger';

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

export function createLogParser(logpath?: string, parseOnce?: boolean): LogParser {
  const defaultpath = ['LocalLow', 'Wizards Of The Coast', 'MTGA', 'output_log.txt'];
  const specialpath = settingsStore.get().logPath;
  logParser = new LogParser(
    logpath !== undefined ? logpath : specialpath !== undefined ? specialpath : defaultpath,
    specialpath !== undefined || logpath !== undefined,
    parseOnce
  );

  logParser.emitter.on('newdata', data => {
    if (data.length > 0) {
      const userToken = settingsStore.get().userToken;
      if (userToken !== undefined && userToken.includes('SKIPPING')) {
        sendMessageToHomeWindow('show-status', {message: 'Skipping this account...', color: '#dbb63d'});
        return;
      }
      const version = app.getVersion();
      uploadpackfile(data, version)
        .then(res => {
          if (!res) {
            withLogParser(lp => lp.stop());
            connectionWaiter(1000);
            sendMessageToHomeWindow('show-status', {message: 'Connection Error', color: '#cc2d2d'});
          }
        })
        .catch(err => error('Failure to upload parsed log data!', err, {version}));
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
    if (msg === 'Connection Error') {
      connectionWaiter(1000);
    }
    sendMessageToHomeWindow('show-status', {message: msg, color: '#cc2d2d'});
  });

  logParser.emitter.on('status', msg => {
    sendMessageToHomeWindow('show-status', {message: msg, color: '#22a83a'});
  });

  logParser.emitter.on('userchange', msg => {
    /*console.log('userchange');
    console.log(msg);*/

    const {playerId, screenName, language} = msg;

    sendMessageToHomeWindow('show-status', {message: 'New User Detected!', color: '#dbb63d'});

    const settings = settingsStore.get();
    const account = getAccountFromScreenName(screenName);

    sendMessageToHomeWindow('set-screenname', screenName);

    // If account is defined, it enforces that awaiting is undefined, because account has a screenName
    if (account !== undefined && account.player) {
      settings.userToken = account.token;
      const lp = getLogParser();
      if (lp) {
        lp.setPlayerId(account.player.playerId, account.player.screenName);
      }
      const userData: UserData = {
        mtgaId: playerId,
        mtgaNick: screenName,
        language,
        token: account.token,
      };
      const version = app.getVersion();
      setuserdata(userData, version).catch(err => error('', err, {...userData, version}));
      setCreds('userchange');
    } else {
      sendMessageToHomeWindow('new-account', undefined);
      settings.awaiting = {playerId, screenName, language};
    }

    settingsStore.save();
  });

  if (!parseOnce && settingsStore.get().overlay) {
    logParser.emitter.on('match-started', msg => {
      const account = settingsStore.getAccount();
      if (account) {
        sendMessageToOverlayWindow('match-started', {...msg, uid: account.uid});
      }
    });
    logParser.emitter.on('card-played', msg => sendMessageToOverlayWindow('card-played', msg));
    logParser.emitter.on('match-over', () => sendMessageToOverlayWindow('match-over', undefined));
  }

  connectionWaiter(1000);
  //createOverlay();

  return logParser;
}
