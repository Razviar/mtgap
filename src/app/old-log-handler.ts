import {app} from 'electron';

import {getParsingMetadata} from 'root/api/getindicators';
import {parseOldLogs, withLogParser} from 'root/app/log_parser_manager';
import {sendMessageToHomeWindow} from 'root/app/messages';
import {showNotifi} from 'root/app/notification';
import {error} from 'root/lib/logger';

export let ReadingOldLogs = false;

export function parseOldLogsHandler(logs: string[], index: number, skipped: number, shadow?: boolean): void {
  ReadingOldLogs = true;
  if (!shadow) {
    sendMessageToHomeWindow('show-prompt', {
      message: `Parsing old log: ${index + 1}/${logs.length} (Skipped: ${skipped})`,
      autoclose: 0,
    });
  } else {
    sendMessageToHomeWindow('show-status', {
      message: `Parsing old logs: ${index + 1}/${logs.length} (Skipped: ${skipped})`,
      color: '#22a83a',
    });
  }
  withLogParser(lp => lp.stop());
  getParsingMetadata(app.getVersion())
    .then(parsingMetadata =>
      parseOldLogs(logs[index], parsingMetadata).then(result => {
        switch (result) {
          case 0:
          case 1:
            if (index + 1 === logs.length) {
              ReadingOldLogs = false;
              if (!shadow) {
                sendMessageToHomeWindow('show-prompt', {message: 'Parsing complete!', autoclose: 1000});
              } else {
                sendMessageToHomeWindow('show-status', {message: 'Old logs are uploaded!', color: '#22a83a'});
                showNotifi('MTGA Pro Tracker', 'All old logs have been parsed!');
              }
              withLogParser(lp => lp.start());
            } else {
              parseOldLogsHandler(logs, index + 1, skipped + result, shadow);
            }
            break;
          case 2:
            sendMessageToHomeWindow('show-prompt', {
              message: 'Found new user during old logs parsing! Please handle this account and repeat old logs parsing',
              autoclose: 1000,
            });
            showNotifi(
              'MTGA Pro Tracker',
              'Found new user during old logs parsing! Please handle this account and repeat old logs parsing'
            );
            break;
        }
      })
    )
    .catch(err => {
      error('Error reading old logs', err);
      ReadingOldLogs = false;
    });
}
