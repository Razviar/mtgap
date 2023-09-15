import fs from 'fs';

import {LogFileOperationResult, LogFileParsingState, ParsingMetadata} from 'root/app/log-parser/model';

export async function getUserCredentials(
  path: string,
  state: LogFileParsingState
): Promise<LogFileOperationResult<{DisplayName: string | undefined; AccountID: string}>> {
  return new Promise<LogFileOperationResult<{DisplayName: string | undefined; AccountID: string}>>(
    (resolve, reject) => {
      const stream = fs.createReadStream(path, {
        encoding: 'utf8',
        autoClose: true,
        emitClose: true,
        start: 0,
      });
      //console.log(path);
      let currentEvent = '';
      let DisplayName = '';
      let AccountID = '';
      let HasInjection = false;
      let loginStateChangeIndex = 0;
      let chunkCursor = 0;
      stream.on('data', (chunk: string) => {
        if (HasInjection || chunk.indexOf('[MTGA.Pro Logger]') !== -1 || currentEvent !== '') {
          chunk = currentEvent + chunk;
          //console.log('has injection!');
          HasInjection = true;
          const loginStateChange = chunk.lastIndexOf('**LoginStateChanged**');
          if (loginStateChange !== -1) {
            loginStateChangeIndex = chunkCursor + loginStateChange;
            DisplayName = '';
            AccountID = '';
          }
          const accountPrefix = '**Userdata**';
          const userID = '"userId":"';
          const accountPrefixIndex = chunk.lastIndexOf(accountPrefix);
          //console.log(accountPrefixIndex);

          const nextLineBreakIndex = chunk.indexOf('\n', accountPrefixIndex + accountPrefix.length);
          if (nextLineBreakIndex === -1) {
            // No line break in this chunk. We save what we have of the event and stop there.
            currentEvent = chunk.slice(accountPrefixIndex);
            //console.log('currentEvent', currentEvent);
            return;
          } else {
            currentEvent = '';
          }

          if (accountPrefixIndex !== -1 && accountPrefixIndex + chunkCursor > loginStateChangeIndex) {
            const accountIdLocator = accountPrefixIndex + accountPrefix.length;
            const AccountIDStart = chunk.indexOf(userID, accountIdLocator);
            AccountID = chunk.slice(AccountIDStart + userID.length).split('"', 2)[0];
            //console.log('test', AccountID);
            const screenNameRealPrefix = '"screenName":"';
            const screenNameIndex = chunk.indexOf(screenNameRealPrefix, accountPrefixIndex);
            if (screenNameIndex !== -1) {
              const screenNameLocator = screenNameIndex + screenNameRealPrefix.length;
              DisplayName = chunk.slice(screenNameLocator).split('"', 2)[0];
            }
          }
        } else {
          // Parse each event on the chunk until we find the one we use to identify the log file
          const accountPrefix = '"authenticateResponse": ';
          const userID = '"clientId": "';
          const accountPrefixIndex = chunk.indexOf(accountPrefix);
          if (accountPrefixIndex !== -1) {
            const accountIdLocator = accountPrefixIndex + accountPrefix.length;
            const AccountIDStart = chunk.indexOf(userID, accountIdLocator);
            AccountID = chunk.slice(AccountIDStart + userID.length).split('"', 2)[0];

            //console.log('AccountID', AccountID);

            //const screenNameRealPrefix = options.screenNamePrefix.replace('{PLAYERID}', AccountID);
            const screenNameRealPrefix = '"screenName": "';
            const screenNameIndex = chunk.indexOf(screenNameRealPrefix, accountPrefixIndex);
            //console.log('screenNameIndex', screenNameIndex);
            if (screenNameIndex !== -1) {
              const screenNameLocator = screenNameIndex + screenNameRealPrefix.length;
              DisplayName = chunk.slice(screenNameLocator).split('"', 2)[0];
              //console.log('DisplayName', DisplayName);
            }
            stream.close();
          }
        }

        /*if (DisplayName !== '' && AccountID !== '') {
          stream.close();
        }*/
        chunkCursor += chunk.length;
      });
      stream.on('close', () => {
        // This would happen if we can find a valid "file id" event in the log file. Should be very rare since
        // the event is logged very early.
        if (DisplayName !== '' && AccountID !== '') {
          resolve([
            {DisplayName, AccountID},
            {...state, bytesRead: 0},
          ]);
        } else if (DisplayName === '' && AccountID !== '') {
          resolve([
            {DisplayName: undefined, AccountID},
            {...state, bytesRead: 0},
          ]);
        } else {
          reject(
            HasInjection
              ? 'Awaiting User ID. It will take up to 30s.'
              : 'Awaiting User ID. Switch into MTGA window and wait about 30s'
          );
        }
        stream.close();
      });
      stream.on('error', (err) => {
        // Generic IO error. Should be very rare.
        reject(err);
        stream.close();
      });
    }
  );
}
