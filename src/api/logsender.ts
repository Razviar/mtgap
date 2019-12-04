import {app} from 'electron';

import {LogFileParsingState} from 'root/app/log-parser/model';
import {sendMessageToHomeWindow} from 'root/app/messages';
import {Request} from 'root/app/request';
import {error} from 'root/lib/logger';
import {asMap, asString} from 'root/lib/type_utils';
import {sleep} from 'root/lib/utils';
import {ParseResults} from 'root/models/indicators';

// Public function to send events to server, non-blocking
export function sendEventsToServer(events: ParseResults[], state?: LogFileParsingState): void {
  if (events.length === 0) {
    return;
  }
  internalBuffer.push({events, state});
  setTimeout(sendNextBatch, fastTimeout);
}

// API call to server
async function uploadpackfile(results: ParseResults[], version: string): Promise<boolean> {
  const res = await Request.gzip<ParseResults[]>(`mtg/donew2.php?cmd=cm_uploadpackfile&version=${version}`, results);
  const resMap = asMap(res);
  if (resMap === undefined) {
    return false;
  }
  return asString(resMap.status, '').toUpperCase() === 'OK';
}

// Internal storage of events
const internalBuffer: EventsWithCursor[] = [];

// Data structure of events with state to know where it is in log file
interface EventsWithCursor {
  events: ParseResults[];
  state?: LogFileParsingState;
}

// Constants
const batchSize = 50;
const slowTimeout = 5000; // Sending every 5s by default or when error
const fastTimeout = 1000; // Sending every 1s if buffer > batchSize

// Global variables
let isCurrentlySending = false;
let currentNumberOfEvents = 0;

// Smart function to send batch events
async function sendNextBatch(): Promise<void> {
  // Safe lock to upload one at a time
  if (isCurrentlySending) {
    return;
  }
  isCurrentlySending = true;

  // Counting events to remove them from buffer once uploaded successfully
  currentNumberOfEvents = 0;

  // Storing events to send
  const events: ParseResults[] = [];

  // Iterate buffer and take batchSize number of events
  for (const part of internalBuffer) {
    if (events.length === 0 || events.length + part.events.length <= batchSize) {
      for (const event of part.events) {
        events.push(event);
      }
      currentNumberOfEvents++;
    } else {
      break;
    }
  }

  // No events to send
  if (events.length === 0) {
    isCurrentlySending = false;
    return;
  }

  // Save error state to slow down rate of sending
  let hasErrored = false;

  try {
    // Uploading data to server
    const ok = await uploadpackfile(events, app.getVersion());
    if (!ok) {
      throw new Error("Couldn't send to server");
    }

    // Data is uploaded, removing it from buffer
    const sentBufferParts = internalBuffer.splice(0, currentNumberOfEvents);
    if (sentBufferParts.length > 0) {
      // TODO - Save state
      // const stateToSave = sentBufferParts[sentBufferParts.length - 1].state;
    }
  } catch (e) {
    // Error has occured, slowing down sending rate
    hasErrored = true;
    error(String(e), e);
    sendMessageToHomeWindow('show-status', {message: 'Connection Error', color: '#cc2d2d'});
  } finally {
    // If error => slow
    // If buffer not empty => fast
    // Default => slow
    const timeout = internalBuffer.length > 0 && !hasErrored ? fastTimeout : slowTimeout;
    await sleep(timeout);

    // Unlocking sending
    isCurrentlySending = false;

    // Triggering next sending
    sendNextBatch().catch(_ => {});
  }
}
