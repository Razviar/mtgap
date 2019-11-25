import { LogParser } from './logparser';
import { uploadpackfile } from '../api/logsender';
import { ParseResults } from '../models/indicators';
import { store, mainWindow, setCreds, createOverlay, connectionWaiter } from '../main';
import { UserSwitch } from './userswitch';
import { setuserdata } from 'root/api/userbytokenid';
import { app } from 'electron';

export function beginParsing(logpath?: string, parseOnce?: boolean): LogParser {
  const defaultpath = ['LocalLow', 'Wizards Of The Coast', 'MTGA', 'output_log.txt'];
  const specialpath = store.get('logpath');
  const logParser = new LogParser(
    logpath ? logpath : specialpath ? specialpath : defaultpath,
    specialpath || logpath ? true : false,
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

    const m = msg as { playerId: string; screenName: string; language: string };

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
      setuserdata(m.playerId, m.screenName, m.language, newtoken, app.getVersion());
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
