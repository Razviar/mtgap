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
};

// Public function to send events to server, non-blocking
export function sendEventsToServer(
  events: ParseResults[],
  parsingMetadata: LogSenderParsingMetadata,
  state: LogFileParsingState,
  fileId?: string
): void {
  logSenderParsingMetadata = parsingMetadata;
  if (events.length === 0) {
    return;
  }
  internalBuffer.push({events, state, fileId});
  setTimeout(sendNextBatch, logSenderParsingMetadata.fastTimeout);
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
      sendMessageToHomeWindow('network-status', {active: false, message: NetworkStatusMessage.Disconnected});
      throw new Error("Couldn't send to server");
    }

    // Data is uploaded, removing it from buffer
    const sentBufferParts = internalBuffer.splice(0, currentNumberOfEvents);
    if (sentBufferParts.length > 0) {
      const cursor = sentBufferParts[sentBufferParts.length - 1];
      // If no fileId, it means it's an old log, therefore we don't save the state
      if (cursor.fileId !== undefined) {
        stateStore.saveState({fileId: cursor.fileId, state: cursor.state});
      }
    }
    sendMessageToHomeWindow('network-status', {
      active: true,
      message: isStillSendingEvents() ? NetworkStatusMessage.SendingEvents : NetworkStatusMessage.Connected,
    });
  } catch (e) {
    // Error has occured, slowing down sending rate
    hasErrored = true;
    error(String(e), e);
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
    sendNextBatch().catch(_ => {});
  }
}

export const isStillSendingEvents = () => internalBuffer.length > 0;
