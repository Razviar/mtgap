import { LogParser } from './logparser';
import { uploadpackfile } from '../api/logsender';
import { ParseResults } from '../models/indicators';
import { store, mainWindow, setCreds } from '../main';
import { UserSwitch } from './userswitch';

export function beginParsing(): LogParser {
  const logParser = new LogParser([
    'LocalLow',
    'Wizards Of The Coast',
    'MTGA',
    'output_log.txt',
  ]);
  logParser.emitter.on('newdata', data => {
    const datasending: ParseResults[] = data as ParseResults[];
    if (datasending.length > 0) {
      uploadpackfile(datasending, store.get('usertoken'));
    }
  });

  logParser.emitter.on('language', data => {
    if (store.get('usertoken')) {
      store.set(store.get('usertoken'), data, 'language');
    }
  });

  logParser.emitter.on('error', msg => {
    mainWindow.webContents.send('show-status', {
      color: '#a11b1b',
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
    //console.log('NT:' + newtoken);
    mainWindow.webContents.send('set-creds', m.screenName);
    if (newtoken !== '' && newtoken !== 'awaiting') {
      store.set('usertoken', newtoken);
      logParser.setPlayerId(
        store.get(newtoken, 'playerId'),
        store.get(newtoken, 'screenName')
      );
      setCreds();
    } else {
      mainWindow.webContents.send('new-account');
      store.set('awaiting', m.playerId, 'playerId');
      store.set('awaiting', m.screenName, 'screenName');
      store.set('awaiting', m.language, 'language');
    }
  });

  logParser.start();

  return logParser;
}
