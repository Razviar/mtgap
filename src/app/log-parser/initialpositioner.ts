import fs from 'fs';

import {ParsingMetadata} from 'root/app/log-parser/model';

export async function initialpositioner(path: string, DisplayName: string, options: ParsingMetadata): Promise<number> {
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
      const userLoginPosition = chunk.lastIndexOf(`Logged in successfully. Display Name: ${DisplayName}`);
      //console.log('Reading chunks...', bytesRead, chunk.length);
      lastchunk = chunk;
      if (userLoginPosition === -1) {
        bytesRead += chunk.length;
      } else {
        bytesRead += userLoginPosition;
        foundId = true;
        meaningfulBytesRead = bytesRead;
        //console.log(`${options.userLoginData.userID}${DisplayName}`, '!!!', meaningfulBytesRead);
        stream.close();
      }

      //chunkStream.close();
      return;
    });
    stream.on('close', () => {
      // This would happen if we can find a valid "file id" event in the log file. Should be very rare since
      // the event is logged very early.
      if (foundId) {
        //console.log('resolving', meaningfulBytesRead);
        resolve(meaningfulBytesRead);
      } else {
        //console.log('rejecting');
        //gameState.setRunning(true);
        resolve(0);
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
