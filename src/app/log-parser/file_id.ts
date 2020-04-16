import {createChunkReader} from 'root/app/log-parser/chunk_reader';
import {LogFileOperationResult, LogFileParsingState, ParsingMetadata} from 'root/app/log-parser/model';
import {extractEventData, extractValue} from 'root/app/log-parser/parsing';
import {asString} from 'root/lib/type_utils';

export async function getFileId(
  path: string,
  state: LogFileParsingState,
  options: ParsingMetadata
): Promise<LogFileOperationResult<string>> {
  return new Promise<LogFileOperationResult<string>>((resolve, reject) => {
    const chunkStream = createChunkReader(path, state.bytesRead);
    chunkStream.onData((chunk: string, bytesRead: number) => {
      // Parse each event on the chunk until we find the one we use to identify the log file
      let chunkCursor = 0;
      while (true) {
        const nextEventIndex = chunk.indexOf(options.eventPrefix, chunkCursor);
        if (nextEventIndex === -1) {
          // No more event in this chunk, we go to the next one
          return;
        }
        const nextEventStart = nextEventIndex + options.eventPrefix.length;

        // Check if this is the event we care about. An easy way to quickly do it is to extract
        // the first few characters (the length of the event name we look for + some extra to account for
        // some eventual trailing whitespaces). Then we simply check if the extracting string starts with
        // the event name.
        const whitespacesPadding = 10;
        const eventStart = chunk
          .slice(nextEventStart, nextEventStart + options.fileId.eventName.length + whitespacesPadding)
          .trimLeft()
          .toUpperCase();
        if (eventStart.indexOf(options.fileId.eventName.toUpperCase()) !== 0) {
          // Not the event we are looking for. We continue the parsing of the chunk
          chunkCursor = nextEventStart;
          continue;
        }

        // This is the event we are looking for. We can start the parsing.
        // We first extract the event JSON
        const jsonStart = chunk.indexOf('{', nextEventStart);
        const partialJSON = chunk.slice(jsonStart).split(/\}\r?\n/, 2)[0];
        const json = `${partialJSON}}`; // json is missing the end } because of the split

        try {
          // Parse the event data
          const parsedEvent = JSON.parse(json);
          const data = extractEventData(options.fileId.eventName, parsedEvent);
          if (data === undefined) {
            reject(new Error('Invalid file id event. No data associated.'));
            chunkStream.close();
            return;
          }
          // Go down the chain of attributes to find the id
          const rawId = extractValue(data, options.fileId.attributesPathToId);
          const id = asString(rawId);
          if (id === undefined) {
            reject(new Error(`Could not find a valid id for the log file in the event data: ${data}`));
          } else {
            resolve([id, {...state, bytesRead: bytesRead + jsonStart + json.length + 1}]);
          }
        } catch (err) {
          reject(new Error('Enable detailed logs in MTGA account and restart game...'));
        }
        chunkStream.close();
        return;
      }
    });
    chunkStream.onEnd(() => {
      // This would happen if we can find a valid "file id" event in the log file. Should be very rare since
      // the event is logged very early.
      reject(new Error('Enable detailed logs in MTGA account and restart game...'));
      chunkStream.close();
    });
    chunkStream.onError((err) => {
      // Generic IO error. Should be very rare.
      reject(err);
      chunkStream.close();
    });
  });
}
