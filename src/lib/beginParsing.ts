import {app} from 'electron';

import {uploadpackfile} from 'root/api/logsender';
import {setuserdata} from 'root/api/userbytokenid';
import {LogParser} from 'root/lib/logparser';
import {asString} from 'root/lib/type_utils';
import {UserSwitch} from 'root/lib/userswitch';
import {connectionWaiter, createOverlay, mainWindow, setCreds, store} from 'root/main';
import {ParseResults} from 'root/models/indicators';

export function beginParsing(logpath?: string, parseOnce?: boolean): LogParser {
  const defaultpath = ['LocalLow', 'Wizards Of The Coast', 'MTGA', 'output_log.txt'];
  const specialpath = asString(store.get('logpath'));
  const logParser = new LogParser(
    logpath !== undefined ? logpath : specialpath !== undefined ? specialpath : defaultpath,
    specialpath !== undefined || logpath !== undefined,
    parseOnce
  );

  logParser.emitter.on('newdata', data => {
    const datasending: ParseResults[] = data as ParseResults[];
    if (datasending.length > 0) {
      if (store.get('usertoken') && store.get('usertoken').includes('SKIPPING')) {
        mainWindow.webContents.send('show-status', {
          color: '#dbb63d',
          message: 'Skipping this account...',
        });
        return;
      }
      uploadpackfile(datasending, app.getVersion()).then(res => {
        if (!res) {
          logParser.stop();
          connectionWaiter(1000);
          mainWindow.webContents.send('show-status', {
            color: '#cc2d2d',
            message: 'Connection Error',
          });
        }
      });
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
    mainWindow.webContents.send('show-status', {
      color: '#cc2d2d',
      message: msg,
    });
  });

  logParser.emitter.on('status', msg => {
    mainWindow.webContents.send('show-status', {
      color: '#22a83a',
      message: msg,
    });
  });

  logParser.emitter.on('userchange', msg => {
    /*console.log('userchange');
    console.log(msg);*/

    const m = msg as {playerId: string; screenName: string; language: string};

    mainWindow.webContents.send('show-status', {
      color: '#dbb63d',
      message: 'New User Detected!',
    });
    const newtoken = UserSwitch(m.screenName);
    //console.log('NT:' + m.screenName + '/' + newtoken);

    mainWindow.webContents.send('set-screenname', m.screenName);

    if (newtoken !== '' && newtoken !== 'awaiting') {
      store.set('usertoken', newtoken);
      logParser.setPlayerId(store.get(newtoken, 'playerId'), store.get(newtoken, 'screenName'));
      setuserdata(
        {mtgaId: m.playerId, mtgaNick: m.screenName, language: m.language, token: newtoken},
        app.getVersion()
      );
      setCreds('userchange');
    } else {
      mainWindow.webContents.send('new-account');
      store.set('awaiting', m.playerId, 'playerId');
      store.set('awaiting', m.screenName, 'screenName');
      store.set('awaiting', m.language, 'language');
    }
  });

  connectionWaiter(1000);
  //createOverlay();

  return logParser;
}
