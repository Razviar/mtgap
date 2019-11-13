import { LogParser } from './logparser';
import { uploadpackfile } from '../api/logsender';
import { ParseResults } from '../models/indicators';
import { store, mainWindow } from '../main';

export function beginParsing(): LogParser {
  const usertoken = store.get('usertoken');
  const language = store.get(usertoken, 'language');
  const logParser = new LogParser(
    ['LocalLow', 'Wizards Of The Coast', 'MTGA', 'output_log.txt'],
    store.get(usertoken, 'playerId'),
    language
  );
  logParser.emitter.on('newdata', data => {
    const datasending: ParseResults[] = data as ParseResults[];
    //console.log(datasending);
    if (datasending.length > 0) {
      uploadpackfile(datasending, +store.get('userid'), usertoken);
    }
  });
  const emitting = ['playerId', 'screenName', 'language'];
  emitting.forEach(em => {
    logParser.emitter.on(em, data => {
      const check = store.get(usertoken, em);
      if ((em === 'playerId' && !check) || em !== 'playerId') {
        store.set(usertoken, data, em);
      }
    });
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
  logParser.start();

  return logParser;
}
