import fs from 'fs';
import {checkDetailedLogEnabled} from './detailed_log';
import {getEvents} from './events';
import {getFileId} from './file_id';
import {parsingMetadata} from './model';

export function main(logPath: string): void {
  console.log('Parsing file', logPath);
  if (fs.existsSync(logPath)) {
    parseLogFileContent(logPath).catch(console.error);
  } else {
    console.log('does not exists');
  }
}

async function parseLogFileContent(logPath: string): Promise<void> {
  const [detailedLogEnabled, cursor1] = await checkDetailedLogEnabled(logPath, parsingMetadata);
  console.log(detailedLogEnabled, cursor1);
  const [fileId, cursor2] = await getFileId(logPath, cursor1, parsingMetadata);
  console.log(fileId, cursor2);
  const [events, cursor3] = await getEvents(logPath, cursor2, parsingMetadata);
  events.forEach(e => {
    console.log(e.event, (JSON.stringify(e.data) || '').slice(0, 100));
  });
}
