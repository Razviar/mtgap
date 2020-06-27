import {app} from 'electron';

import {LogFileParsingState, LogSenderParsingMetadata} from 'root/app/log-parser/model';
import {sendMessageToHomeWindow} from 'root/app/messages';
import {Request} from 'root/app/request';
import {stateStore} from 'root/app/state_store';
import {error} from 'root/lib/logger';
import {NetworkStatusMessage} from 'root/lib/messages';
import {asMap, asString} from 'root/lib/type_utils';
import {sleep} from 'root/lib/utils';
import {ParseResults} from 'root/models/indicators';

// Constants
let logSenderParsingMetadata: LogSenderParsingMetadata = {
  fastTimeout: 1000,
  slowTimeout: 5000,
  batchSize: 50,
  sendingRates: {},
  sendOnlyTheLast: {
    '2': 1,
  },
  forceUpload: false,
};

function clearIndicatorInBuffer(indicator: number): void {
  for (const buffer of internalBuffer) {
    buffer.events = buffer.events.filter((event) => event.indicator !== indicator);
  }
}

// Network improvement for redundant events
function filterOnlyLastEvents(events: ParseResults[]): ParseResults[] {
  const res: ParseResults[] = [];
  for (const event of events) {
    if (logSenderParsingMetadata.sendOnlyTheLast.hasOwnProperty(event.indicator)) {
      // Removing from all events
      clearIndicatorInBuffer(event.indicator);
      // Removing from current batch
      const notLastIndex = res.findIndex((_) => _.indicator === event.indicator);
      if (notLastIndex > -1) {
        res.splice(notLastIndex, 1);
      }
    }
    res.push(event);
  }
  return res;
}

// Public function to send events to server, non-blocking
export function sendEventsToServer(
  events: ParseResults[],
  parsingMetadata: LogSenderParsingMetadata,
  state: LogFileParsingState,
  fileId?: string,
  forceUpload?: boolean
): void {
  logSenderParsingMetadata = parsingMetadata;
  logSenderParsingMetadata.forceUpload = forceUpload;
  //console.log(events);
  //console.log(forceUpload);
  if (events.length === 0) {
    return;
  }
  internalBuffer.push({events: filterOnlyLastEvents(events), state, fileId});
  setTimeout(sendNextBatch, logSenderParsingMetadata.fastTimeout);
}

// API call to server
async function uploadpackfile(results: ParseResults[], version: string): Promise<string | boolean> {
  try {
    const res = await Request.gzip<ParseResults[]>(`/mtg/donew2.php?cmd=cm_uploadpackfile&version=${version}`, results);
    const resMap = asMap(res);
    /*console.log('!!!');
    console.log(res);
    console.log('!!!');*/
    if (resMap === undefined) {
      return false;
    }
    return asString(resMap.status, '').toUpperCase();
  } catch (e) {
    return false;
  }
}

// Internal storage of events
const internalBuffer: EventsWithCursor[] = [];

// Data structure of events with state to know where it is in log file
interface EventsWithCursor {
  events: ParseResults[];
  state: LogFileParsingState;
  fileId?: string;
}

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
    if (events.length === 0 || events.length + part.events.length <= logSenderParsingMetadata.batchSize) {
      for (const event of part.events) {
        let sendingRate = logSenderParsingMetadata.sendingRates[event.indicator] as number | undefined;
        if (sendingRate === undefined) {
          sendingRate = 1;
        }
        if (Math.random() <= sendingRate) {
          events.push(event);
        }
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
    // if (logSenderParsingMetadata.forceUpload) {
    //   console.log(events);
    // }
    const ok = await uploadpackfile(events, app.getVersion());
    if (ok === 'RESTART') {
      sendMessageToHomeWindow('restart-me', undefined);
    }
    if (ok === false) {
      //console.log(ok);
      //console.log(events);
      sendMessageToHomeWindow('network-status', {active: false, message: NetworkStatusMessage.Disconnected});
      throw new Error("Couldn't send to server");
    }

    // Data is uploaded, removing it from buffer
    const sentBufferParts = internalBuffer.splice(0, currentNumberOfEvents);
    if (sentBufferParts.length > 0) {
      // Filtering old logs to make sure we send state when it's mixed with new logs
      const filteredSentBufferParts = sentBufferParts.filter((_) => _.fileId !== undefined);
      if (filteredSentBufferParts.length > 0) {
        const cursor = filteredSentBufferParts[filteredSentBufferParts.length - 1];
        // If no fileId, it means it's an old log, therefore we don't save the state
        if (cursor.fileId !== undefined) {
          stateStore.saveState({fileId: cursor.fileId, state: cursor.state});
        }
      }
    }
    sendMessageToHomeWindow('network-status', {
      active: true,
      message: isStillSendingEvents() ? NetworkStatusMessage.SendingEvents : NetworkStatusMessage.Connected,
      eventsleft: internalBuffer.length,
    });
  } catch (e) {
    // Error has occured, slowing down sending rate
    hasErrored = true;
    //console.log(e);
    error(String(e), e, {}, true);
    sendMessageToHomeWindow('show-status', {message: 'Connection Error', color: '#cc2d2d'});
  } finally {
    // If error => slow
    // If buffer not empty => fast
    // Default => slow
    const timeout =
      internalBuffer.length > 0 && !hasErrored
        ? logSenderParsingMetadata.fastTimeout
        : logSenderParsingMetadata.slowTimeout;
    await sleep(timeout);

    // Unlocking sending
    isCurrentlySending = false;

    // Triggering next sending
    sendNextBatch().catch((_) => {});
  }
}

export const isStillSendingEvents = () => internalBuffer.length > 0;
