import {createChunkReader} from 'root/app/log-parser/chunk_reader';
import {ParsingMetadata} from 'root/app/log-parser/model';

export async function initialpositioner(path: string, AccountID: string, options: ParsingMetadata): Promise<number> {
  return new Promise<number>((resolve, reject) => {
    const chunkStream = createChunkReader(path, 0);
    chunkStream.onData((chunk: string, bytesRead: number) => {
      const userLoginPosition = chunk.indexOf(`${options.userLoginData.userID}${AccountID}`);
      if (userLoginPosition === -1) {
        // No more event in this chunk, we go to the next one
        return;
      }

      resolve(userLoginPosition);

      chunkStream.close();
      return;
    });
    chunkStream.onEnd(() => {
      // This would happen if we can find a valid "file id" event in the log file. Should be very rare since
      // the event is logged very early.
      reject('Awaiting user credentials to appear in log...');
      chunkStream.close();
    });
    chunkStream.onError((err) => {
      // Generic IO error. Should be very rare.
      reject(err);
      chunkStream.close();
    });
  });
}
