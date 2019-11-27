import {settings} from 'cluster';
import {app} from 'electron';

import {uploadpackfile} from 'root/api/logsender';
import {setuserdata, UserData} from 'root/api/userbytokenid';
import {setCreds} from 'root/app/auth';
import {withMainWindow} from 'root/app/main_window';
import {withOverlayWindow} from 'root/app/overlay_window';
import {connectionWaiter} from 'root/app/process_watcher';
import {error} from 'root/lib/logger';
import {LogParser} from 'root/lib/logparser';
import {Player, settingsStore} from 'root/lib/settings_store';
import {getAccountFromScreenName} from 'root/lib/userswitch';
import {ParseResults} from 'root/models/indicators';

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
    const datasending: ParseResults[] = data as ParseResults[];
    if (datasending.length > 0) {
      const userToken = settingsStore.get().userToken;
      if (userToken !== undefined && userToken.includes('SKIPPING')) {
        withMainWindow(w =>
          w.webContents.send('show-status', {
            color: '#dbb63d',
            message: 'Skipping this account...',
          })
        );
        return;
      }
      const version = app.getVersion();
      uploadpackfile(datasending, version)
        .then(res => {
          if (!res) {
            withLogParser(lp => lp.stop());
            connectionWaiter(1000);
            withMainWindow(w =>
              w.webContents.send('show-status', {
                color: '#cc2d2d',
                message: 'Connection Error',
              })
            );
          }
        })
        .catch(err => error('Failure to upload parsed log data!', err, {version}));
    }
  });

  logParser.emitter.on('language', data => {
    const account = settingsStore.getAccount();
    if (account !== undefined && account.player) {
      account.player.language = data as string;
      settingsStore.save();
    }
  });

  logParser.emitter.on('error', msg => {
    if (msg === 'Connection Error') {
      connectionWaiter(1000);
    }
    withMainWindow(w =>
      w.webContents.send('show-status', {
        color: '#cc2d2d',
        message: msg,
      })
    );
  });

  logParser.emitter.on('status', msg => {
    withMainWindow(w =>
      w.webContents.send('show-status', {
        color: '#22a83a',
        message: msg,
      })
    );
  });

  logParser.emitter.on('userchange', msg => {
    /*console.log('userchange');
    console.log(msg);*/

    const {playerId, screenName, language} = msg as Player;

    withMainWindow(w =>
      w.webContents.send('show-status', {
        color: '#dbb63d',
        message: 'New User Detected!',
      })
    );

    const settings = settingsStore.get();
    const account = getAccountFromScreenName(screenName);

    withMainWindow(w => w.webContents.send('set-screenname', screenName));

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
      withMainWindow(w => w.webContents.send('new-account'));
      settings.awaiting = {playerId, screenName, language};
    }

    settingsStore.save();
  });

  if (!parseOnce && settingsStore.get().overlay) {
    logParser.emitter.on('match-started', msg => {
      const account = settingsStore.getAccount();
      if (account) {
        withOverlayWindow(w => w.webContents.send('match-started', {matchId: msg, uid: account.uid}));
      }
    });
  }

  connectionWaiter(1000);
  //createOverlay();

  return logParser;
}
