import {createChunkReader} from 'root/app/log-parser/chunk_reader';
import {LogFileOperationResult, LogFileParsingState, ParsingMetadata} from 'root/app/log-parser/model';

export async function getUserCredentials(
  path: string,
  state: LogFileParsingState,
  options: ParsingMetadata
): Promise<LogFileOperationResult<{DisplayName: string; AccountID: string}>> {
  return new Promise<LogFileOperationResult<{DisplayName: string; AccountID: string}>>((resolve, reject) => {
    const chunkStream = createChunkReader(path, state.bytesRead);
    chunkStream.onData((chunk: string, bytesRead: number) => {
      // Parse each event on the chunk until we find the one we use to identify the log file
      while (true) {
        const nextEventIndex = chunk.indexOf(options.accountPrefix);
        if (nextEventIndex === -1) {
          // No more event in this chunk, we go to the next one
          return;
        }
        const nextEventStart = nextEventIndex + options.accountPrefix.length;

        // This is the event we are looking for. We can start the parsing.
        // We first extract the event JSON
        const DisplayNameStart = chunk.indexOf(options.userLoginData.userName, nextEventStart);
        const DisplayName = chunk.slice(DisplayNameStart + options.userLoginData.userName.length).split(',', 2)[0];

        const AccountIDStart = chunk.indexOf(options.userLoginData.userID, DisplayNameStart + DisplayName.length);
        const AccountID = chunk.slice(AccountIDStart + options.userLoginData.userID.length).split(',', 2)[0];

        resolve([
          {DisplayName, AccountID},
          {...state, bytesRead: bytesRead + DisplayNameStart + DisplayName.length + 1},
        ]);

        chunkStream.close();
        return;
      }
    });
    chunkStream.onEnd(() => {
      // This would happen if we can find a valid "file id" event in the log file. Should be very rare since
      // the event is logged very early.
      reject(new Error('Unable to get user data...'));
      chunkStream.close();
    });
    chunkStream.onError((err) => {
      // Generic IO error. Should be very rare.
      reject(err);
      chunkStream.close();
    });
  });
}
