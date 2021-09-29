import fs from 'fs';

import {
  LogFileOperationResult,
  LogFileParsingState,
  ParsingMetadata,
  StatefulLogEvent,
} from 'root/app/log-parser/model';
import {parseEvent} from 'root/app/log-parser/parsing';
import {locateMostRecentDate} from 'root/app/mtga_dir_ops';

function shouldStopParsing(allEvents: StatefulLogEvent[], options: ParsingMetadata): boolean {
  if (allEvents.length === 0) {
    return false;
  }
  if (allEvents.length > options.logParser.batchSize) {
    return true;
  }
  const lastEvent = allEvents[allEvents.length - 1];
  return lastEvent.name === options.userChangeEvent;
}

export async function getEvents(
  path: string,
  state: LogFileParsingState,
  options: ParsingMetadata,
  oldlog?: boolean
): Promise<LogFileOperationResult<StatefulLogEvent[]>> {
  return new Promise<LogFileOperationResult<StatefulLogEvent[]>>((resolve, reject) => {
    const fileStream = fs.createReadStream(path, {
      encoding: 'utf8',
      autoClose: true,
      start: state.bytesRead,
    });

    let bytesRead = state.bytesRead;
    let currentEvent: string | undefined;
    const allEvents: StatefulLogEvent[] = [];

    if (!oldlog && (state.timestamp === undefined || state.timestamp === 1 || state.timestamp < 0)) {
      state.timestamp = locateMostRecentDate().date;
    }

    fileStream.on('data', (chunk: string) => {
      bytesRead += chunk.length;
      let chunkCursor = 0;
      // If we are parsing an event, we look for a line break
      if (currentEvent !== undefined) {
        const res = chunk.split(/\r?\n/, 2);
        if (res.length === 1) {
          // If we haven't found a line break, the entire chunk is still part of the current event
          currentEvent += chunk;
          return;
        } else {
          // If we've found a line break, we have the rest of the event
          currentEvent += res[0];
          chunkCursor += res[0].length;
          //console.log(currentEvent);
          parseEvent(currentEvent, state, options, oldlog).forEach((e) => allEvents.push(e));
          if (shouldStopParsing(allEvents, options)) {
            fileStream.close();
            resolve([allEvents, {...state, bytesRead: bytesRead - res[1].length}]);
            return;
          }
          currentEvent = undefined;
        }
      }

      // We loop until we are done reading events (ie. reached the end of the chunk)
      while (true) {
        // If we arrive here, there are no event currently being parsed, so we look for the event prefix
        const prefIndex = chunk.indexOf(options.eventPrefix, chunkCursor);
        const prefIndexExtra = chunk.indexOf(options.eventPrefixExtra, chunkCursor);
        const nextPrefixIndex =
          prefIndex < prefIndexExtra
            ? prefIndex != -1
              ? prefIndex
              : prefIndexExtra
            : prefIndexExtra != -1
            ? prefIndexExtra
            : prefIndex;
        const eventPrefix =
          prefIndex < prefIndexExtra
            ? prefIndex != -1
              ? options.eventPrefix
              : options.eventPrefixExtra
            : prefIndexExtra != -1
            ? options.eventPrefixExtra
            : options.eventPrefix;
        //const eventPrefix = prefIndex < prefIndexExtra ? options.eventPrefix : options.eventPrefixExtra;
        //console.log('PREFIXES!!!', prefIndex, prefIndexExtra, nextPrefixIndex, eventPrefix);

        if (nextPrefixIndex === -1) {
          // No more event in this chunk
          return;
        }
        // We've found the start of the event, we now try to find a line break
        let nextLineBreakIndex = chunk.indexOf('\n', nextPrefixIndex + eventPrefix.length);
        if (nextLineBreakIndex === -1) {
          // No line break in this chunk. We save what we have of the event and stop there.
          currentEvent = chunk.slice(nextPrefixIndex + eventPrefix.length, chunk.length);
          return;
        }

        // We've found a line break, but we are not done yet. Sometimes the events print the JSON info
        // on the next line, so we check for that as well.

        if (chunk[nextLineBreakIndex + 1] === '{' || chunk[nextLineBreakIndex + 1] === '<') {
          let lineBreakAfter = chunk.indexOf('\n', nextLineBreakIndex + 1);
          if (chunk[nextLineBreakIndex + 1] === '<') {
            lineBreakAfter = chunk.indexOf('\n', lineBreakAfter + 1);
          }
          if (lineBreakAfter === -1) {
            // Ok... this means we are dealing with an event that has JSON info on the next line, but we
            // don't have all the JSON in this chunk.
            // So we save whatever we currently have (but remove the line break) and are done with the parsing
            // of this chunk.
            currentEvent = chunk
              .slice(nextPrefixIndex + eventPrefix.length, chunk.length)
              .split(/\r?\n/)
              .join(chunk[nextLineBreakIndex + 1] === '<' ? ' ' : '');
            return;
          }
          // If the line break had a carriage return, we go back one character
          if (chunk[lineBreakAfter - 1] === '\r') {
            lineBreakAfter--;
          }
          const eventString = chunk
            .slice(nextPrefixIndex + eventPrefix.length, lineBreakAfter)
            .split(/\r?\n/)
            .join(chunk[nextLineBreakIndex + 1] === '<' ? ' ' : '');
          //console.log(eventString);
          parseEvent(eventString, state, options).forEach((e) => allEvents.push(e));
          if (shouldStopParsing(allEvents, options)) {
            fileStream.close();
            resolve([allEvents, {...state, bytesRead: bytesRead - chunk.length + lineBreakAfter}]);
            return;
          }
          chunkCursor = lineBreakAfter;
        } else {
          // If the line break had a carriage return, we go back one character
          if (chunk[nextLineBreakIndex - 1] === '\r') {
            nextLineBreakIndex--;
          }
          const eventString = chunk.slice(nextPrefixIndex + eventPrefix.length, nextLineBreakIndex);
          //console.log(eventString);
          parseEvent(eventString, state, options).forEach((e) => allEvents.push(e));
          if (shouldStopParsing(allEvents, options)) {
            fileStream.close();
            resolve([allEvents, {...state, bytesRead: bytesRead - chunk.length + nextLineBreakIndex}]);
            return;
          }
          chunkCursor = nextLineBreakIndex;
        }
      }
    });
    fileStream.on('end', () => {
      fileStream.close();
      resolve([allEvents, {...state, bytesRead}]);
    });
    fileStream.on('error', (err) => {
      reject(err);
      fileStream.close();
    });
  });
}
