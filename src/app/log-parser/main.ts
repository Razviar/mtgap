import {checkDetailedLogEnabled} from 'root/app/log-parser/detailed_log';
import {getEvents} from 'root/app/log-parser/events';
import {getFileId} from 'root/app/log-parser/file_id';
import {parsingMetadata} from 'root/app/log-parser/model';
import {removeUndefined} from 'root/lib/type_utils';
import {ParseResults} from 'root/models/indicators';

export async function parseLogFile(logPath: string): Promise<ParseResults[]> {
  const start = Date.now();
  const [detailedLogEnabled, state1] = await checkDetailedLogEnabled(logPath, parsingMetadata);
  const [fileId, state2] = await getFileId(logPath, state1, parsingMetadata);
  const [events, state3] = await getEvents(logPath, state2, parsingMetadata);
  return removeUndefined(
    events.map(e =>
      e.indicator === undefined
        ? undefined
        : {
            time: e.timestamp === undefined ? 1 : e.timestamp,
            indicator: e.indicator,
            json: JSON.stringify(e.rawData),
            uid: e.userId === undefined ? '' : e.userId,
            matchId: e.matchId === undefined ? '' : e.matchId,
          }
    )
  );
}
