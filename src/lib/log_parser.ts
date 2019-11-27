import {app} from 'electron';

import {uploadpackfile} from 'root/api/logsender';
import {setuserdata, UserData} from 'root/api/userbytokenid';
import {setCreds} from 'root/app/auth';
import {withMainWindow} from 'root/app/main_window';
import {withOverlayWindow} from 'root/app/overlay_window';
import {connectionWaiter} from 'root/app/process_watcher';
import {error} from 'root/lib/logger';
import {LogParser} from 'root/lib/logparser';
import {asString} from 'root/lib/type_utils';
import {UserSwitch} from 'root/lib/userswitch';
import {store} from 'root/main';
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
  const specialpath = asString(store.get('logpath'));
  logParser = new LogParser(
    logpath !== undefined ? logpath : specialpath !== undefined ? specialpath : defaultpath,
    specialpath !== undefined || logpath !== undefined,
    parseOnce
  );

  logParser.emitter.on('newdata', data => {
    const datasending: ParseResults[] = data as ParseResults[];
    if (datasending.length > 0) {
      if (store.get('usertoken') && store.get('usertoken').includes('SKIPPING')) {
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
    if (store.get('usertoken')) {
      store.set(store.get('usertoken'), data, 'language');
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

    const m = msg as {playerId: string; screenName: string; language: string};

    withMainWindow(w =>
      w.webContents.send('show-status', {
        color: '#dbb63d',
        message: 'New User Detected!',
      })
    );
    const newtoken = UserSwitch(m.screenName);
    //console.log('NT:' + m.screenName + '/' + newtoken);

    withMainWindow(w => w.webContents.send('set-screenname', m.screenName));

    if (newtoken !== '' && newtoken !== 'awaiting') {
      store.set('usertoken', newtoken);
      withLogParser(lp => lp.setPlayerId(store.get(newtoken, 'playerId'), store.get(newtoken, 'screenName')));
      const userData: UserData = {mtgaId: m.playerId, mtgaNick: m.screenName, language: m.language, token: newtoken};
      const version = app.getVersion();
      setuserdata(userData, version).catch(err => error('', err, {...userData, version}));
      setCreds('userchange');
    } else {
      withMainWindow(w => w.webContents.send('new-account'));
      store.set('awaiting', m.playerId, 'playerId');
      store.set('awaiting', m.screenName, 'screenName');
      store.set('awaiting', m.language, 'language');
    }
  });

  if (!parseOnce && store.get('overlay')) {
    logParser.emitter.on('match-started', msg => {
      withOverlayWindow(w =>
        w.webContents.send('match-started', {matchId: msg, uid: store.get(store.get('usertoken'), 'uid')})
      );
    });
  }

  connectionWaiter(1000);
  //createOverlay();

  return logParser;
}
