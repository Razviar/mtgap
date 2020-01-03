import {createChunkReader} from 'root/app/log-parser/chunk_reader';
import {LogFileOperationResult, ParsingMetadata} from 'root/app/log-parser/model';

export async function checkDetailedLogEnabled(
  path: string,
  options: ParsingMetadata
): Promise<LogFileOperationResult<boolean>> {
  return new Promise<LogFileOperationResult<boolean>>((resolve, reject) => {
    const chunkStream = createChunkReader(path, 0);
    chunkStream.onData((chunk: string, bytesRead: number) => {
      // Look for the "detailed log info" prefix
      const res = chunk.split(options.detailedLogInfo.prefix, 2);
      if (res.length === 1) {
        // If not found, we can skip this chunk
        bytesRead += chunk.length;
        return;
      }
      // Prefix was found. We look for the end of line character.
      const [beforePrefix, afterPrefix] = res;
      bytesRead += beforePrefix.length + options.detailedLogInfo.prefix.length;

      // Look for the line break character that marks the end of the "detailed log" value
      const [detailedLogString] = afterPrefix.split(/\r?\n/, 2);
      const additionalByteRead = beforePrefix.length + options.detailedLogInfo.prefix.length + detailedLogString.length;

      // Normalize the value by trimming whitespaces and doing converting to uppercase
      // (we are doing case-insensitive comparison)
      const normalizedString = detailedLogString.trim().toUpperCase();
      if (normalizedString === options.detailedLogInfo.enabledValue.toUpperCase()) {
        resolve([true, {bytesRead: bytesRead + additionalByteRead}]);
      } else if (normalizedString === options.detailedLogInfo.disabledValue.toUpperCase()) {
        resolve([false, {bytesRead: bytesRead + additionalByteRead}]);
      } else {
        reject(new Error(`Unknown value for detailed log info: "${detailedLogString}"`));
      }

      // We're done, we can close the stream
      chunkStream.close();
    });
    chunkStream.onEnd(() => {
      // This should never happen unless there is a race condition we are parsing the log file extremely
      // early in its lifecycle and the "detailed log" line has not been written yet.
      resolve([false, {bytesRead: 0}]);
      chunkStream.close();
    });
    chunkStream.onError(err => {
      // Generic IO error. Should be very rare.
      reject(err);
      chunkStream.close();
    });
  });
}
