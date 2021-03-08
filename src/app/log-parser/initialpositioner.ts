import fs from 'fs';

import {ParsingMetadata} from 'root/app/log-parser/model';
import {gameState} from '../game_state';

export async function initialpositioner(path: string, AccountID: string, options: ParsingMetadata): Promise<number> {
  //console.log(path);
  return new Promise<number>((resolve, reject) => {
    const stream = fs.createReadStream(path, {
      encoding: 'utf8',
      autoClose: true,
      start: 0,
    });
    let foundId = false;
    let lastchunk = '';
    let meaningfulBytesRead = 0;
    let bytesRead = 0;
    stream.on('data', (chunk: string) => {
      const userLoginPosition = chunk.lastIndexOf(`${options.userLoginData.userID}${AccountID}`);
      //console.log('Reading chunks...', bytesRead, chunk.length);
      lastchunk = chunk;
      if (userLoginPosition === -1) {
        bytesRead += chunk.length;
      } else {
        bytesRead += userLoginPosition;
        foundId = true;
        meaningfulBytesRead = bytesRead;
        //console.log(`${options.userLoginData.userID}${AccountID}`, '!!!', meaningfulBytesRead);
      }

      //chunkStream.close();
      return;
    });
    stream.on('end', () => {
      // This would happen if we can find a valid "file id" event in the log file. Should be very rare since
      // the event is logged very early.
      if (foundId) {
        //console.log('resolving', meaningfulBytesRead);
        resolve(meaningfulBytesRead);
      } else {
        //console.log('rejecting');
        gameState.setRunning(true);
        reject('Awaiting user credentials to appear in log...');
      }
      stream.close();
    });
    stream.on('error', (err) => {
      // Generic IO error. Should be very rare.
      reject(err);
      stream.close();
    });
  });
}
