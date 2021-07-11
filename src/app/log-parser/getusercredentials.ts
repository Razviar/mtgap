import fs from 'fs';

import {LogFileOperationResult, LogFileParsingState, ParsingMetadata} from 'root/app/log-parser/model';

export async function getUserCredentials(
  path: string,
  state: LogFileParsingState,
  options: ParsingMetadata
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
      stream.on('data', (chunk: string) => {
        // Parse each event on the chunk until we find the one we use to identify the log file

        const accountPrefixIndex = chunk.indexOf(options.accountPrefix);
        if (accountPrefixIndex !== -1) {
          const accountIdLocator = accountPrefixIndex + options.accountPrefix.length;
          const AccountIDStart = chunk.indexOf(options.userLoginData.userID, accountIdLocator);
          AccountID = chunk.slice(AccountIDStart + options.userLoginData.userID.length).split('"', 2)[0];
        }

        //const screenNameRealPrefix = options.screenNamePrefix.replace('{PLAYERID}', AccountID);
        const screenNameRealPrefix = 'Logged in successfully. Display Name: ';
        const screenNameIndex = chunk.indexOf(screenNameRealPrefix);
        //console.log('screenNameIndex', screenNameIndex);
        if (screenNameIndex !== -1) {
          const screenNameLocator = screenNameIndex + screenNameRealPrefix.length;
          DisplayName = chunk.slice(screenNameLocator).split('\n', 2)[0].replace('\r', '');
          //console.log('DisplayName', DisplayName);
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
          reject('Awaiting User ID to appear in log. Normally this takes up to 30 seconds...');
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
