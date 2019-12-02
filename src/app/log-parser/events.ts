import fs from 'fs';

import {RawLogEvent, LogFileOperationResult, ParsingMetadata} from './model';
import {asMap} from '../../lib/type_utils';
import {eventNames} from 'cluster';

const eventPrefix = '[UnityCrossThreadLogger]';

export async function getEvents(
  path: string,
  cursor: number,
  options: ParsingMetadata
): Promise<LogFileOperationResult<RawLogEvent[]>> {
  return new Promise<LogFileOperationResult<RawLogEvent[]>>((resolve, reject) => {
    const fileStream = fs.createReadStream(path, {
      encoding: 'utf8',
      autoClose: true,
      start: cursor,
    });

    let bytesRead = cursor;
    let currentEvent: string | undefined;
    const allEvents: RawLogEvent[] = [];

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
          const parsed = parseAsRawEvent(currentEvent);
          if (parsed !== undefined) {
            allEvents.push(parsed);
          }
          currentEvent = undefined;
        }
      }

      // We loop until we are done reading events (ie. reached the end of the chunk)
      while (true) {
        // If we arrive here, there are no event currently being parsed, so we look for the event prefix
        const nextPrefixIndex = chunk.indexOf(eventPrefix, chunkCursor);
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
        if (chunk[nextLineBreakIndex + 1] === '{') {
          let lineBreakAfter = chunk.indexOf('\n', nextLineBreakIndex + 1);
          if (lineBreakAfter === -1) {
            // Ok... this means we are dealing with an event that has JSON info on the next line, but we
            // don't have all the JSON in this chunk.
            // So we save whatever we currently have (but remove the line break) and are done with the parsing
            // of this chunk.
            currentEvent = chunk
              .slice(nextPrefixIndex + eventPrefix.length, chunk.length)
              .split(/\r?\n/, 2)
              .join('');
            return;
          }
          // If the line break had a carriage return, we go back one character
          if (chunk[lineBreakAfter - 1] === '\r') {
            lineBreakAfter--;
          }
          const newEvent = parseAsRawEvent(
            chunk
              .slice(nextPrefixIndex + eventPrefix.length, lineBreakAfter)
              .split(/\r?\n/, 2)
              .join('')
          );
          chunkCursor = lineBreakAfter;
          if (newEvent !== undefined) {
            allEvents.push(newEvent);
          }
        } else {
          // If the line break had a carriage return, we go back one character
          if (chunk[nextLineBreakIndex - 1] === '\r') {
            nextLineBreakIndex--;
          }
          const newEvent = parseAsRawEvent(chunk.slice(nextPrefixIndex + eventPrefix.length, nextLineBreakIndex));
          chunkCursor = nextLineBreakIndex;
          if (newEvent !== undefined) {
            allEvents.push(newEvent);
          }
        }
      }
    });
    fileStream.on('end', () => {
      fileStream.close();
      resolve([allEvents, bytesRead]);
    });
    fileStream.on('error', err => {
      reject(err);
      fileStream.close();
    });
  });
}

function parseAsRawEvent(value: string): RawLogEvent | undefined {
  const firstOpenCurlyBraces = value.indexOf('{');
  // No JSON, this is not an event we care about
  if (firstOpenCurlyBraces === -1) {
    return undefined;
  }
  // Found a {, we parse the data as JSON
  try {
    const eventName = postProcessEventName(value.slice(0, firstOpenCurlyBraces));
    // // Filter out events that are not in the whitelist
    // if (eventWhitelist.indexOf(eventName) === -1) {
    //   return undefined;
    // }
    const rawData = JSON.parse(value.slice(firstOpenCurlyBraces));
    const data = extractEventData(eventName, rawData);
    if (data === undefined) {
      return undefined;
    }
    return {event: eventName, data, rawData};
  } catch (err) {
    // Failure to parse the JSON, this is not a valid event for us
    return undefined;
  }
}

const timedMessageRegex = /^[0-9]{2}\/[0-9]{2}\/[0-9]{4}/;

function postProcessEventName(message: string): string {
  // Some messages are time based. For those we only care of the last part
  if (message.match(timedMessageRegex)) {
    const fragments = message.split(' ');
    return fragments[fragments.length - 1].trim();
  }
  // For the other, we trim the whitespaces. Can't hurt.
  return message.trim();
}

export function extractEventData(eventName: string, rawData: any): any | undefined {
  const dataMap = asMap(rawData);
  if (dataMap === undefined) {
    return undefined;
  }
  // Events have the data stored on different attributes. It can be found:
  // - on the `request` attribute. This is generally (but not exclusively) found on "==> ***" events
  // - on the `payload` attribute. This is generally (but not exclusively) found on "<== ***" events
  // - on an attribute that is the `eventName`, but camel cased
  if (dataMap.request !== undefined) {
    return parseAsJSONIfNeeded(dataMap.request);
  }
  if (dataMap.payload !== undefined) {
    return parseAsJSONIfNeeded(dataMap.payload);
  }
  const eventNameUpperCase = eventName.toUpperCase();
  const eventNameProperty = Object.keys(dataMap).find(attr => attr.toUpperCase() === eventNameUpperCase);
  if (eventNameProperty !== undefined) {
    return parseAsJSONIfNeeded(dataMap[eventNameProperty]);
  }
  return undefined;
}

function parseAsJSONIfNeeded(data: any): any {
  // The heuristic here is that we will parse the data as a JSON if it's a
  // non-empty string that starts with '{'
  if (typeof data === 'string' && data.length > 0 && data[0] === '{') {
    try {
      return JSON.parse(data);
    } catch (err) {}
  }
  return data;
}
