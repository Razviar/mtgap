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
      let DisplayName = '';
      let AccountID = '';
      let HasInjection = false;
      stream.on('data', (chunk: string) => {
        if (chunk.indexOf('[MTGA.Pro Logger]') !== -1) {
          HasInjection = true;
          const accountPrefix = '**Userdata**';
          const userID = '"userId":"';
          const accountPrefixIndex = chunk.indexOf(accountPrefix);
          if (accountPrefixIndex !== -1) {
            const accountIdLocator = accountPrefixIndex + accountPrefix.length;
            const AccountIDStart = chunk.indexOf(userID, accountIdLocator);
            AccountID = chunk.slice(AccountIDStart + userID.length).split('"', 2)[0];
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
          }
        }

        if (DisplayName !== '' && AccountID !== '') {
          stream.close();
        }
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
              : 'Awaiting User ID. Please play a match to get it.'
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
