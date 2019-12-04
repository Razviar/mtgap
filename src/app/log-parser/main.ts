import {format} from 'date-fns';
import {app} from 'electron';
import {existsSync} from 'fs';
import {join} from 'path';

import {getParsingMetadata} from 'root/api/getindicators';
import {sendEventsToServer} from 'root/api/logsender';
import {checkDetailedLogEnabled} from 'root/app/log-parser/detailed_log';
import {getEvents} from 'root/app/log-parser/events';
import {getFileId} from 'root/app/log-parser/file_id';
import {LogFileParsingState, ParsingMetadata} from 'root/app/log-parser/model';
import {LogParserEventEmitter} from 'root/app/log_parser_events';
import {error} from 'root/lib/logger';
import {removeUndefined} from 'root/lib/type_utils';
import {sleep} from 'root/lib/utils';

const defaultTimeout = 500;

export class LogParser2 {
  private readonly path: string;
  private readonly parseOnce: boolean = false;
  private shouldStop: boolean = false;

  public emitter = new LogParserEventEmitter();

  constructor(targetname: string[] | string, pathset?: boolean, parseOnce?: boolean) {
    console.log('LogParser2', 'constructor');
    if (!pathset) {
      const appDataPath = app.getPath('appData');
      this.path = join(appDataPath, ...targetname).replace('Roaming\\', '');
    } else {
      this.path = targetname as string;
    }
    if (parseOnce) {
      this.parseOnce = true;
    }
  }

  public async start(): Promise<void> {
    console.log('LogParser2', 'start');
    try {
      if (!existsSync(this.path)) {
        this.emitter.emit('error', 'No log file found');
        return;
      }

      const parsingMetadata = await getParsingMetadata(app.getVersion());

      const [detailedLogEnabled, detailedLogState] = await checkDetailedLogEnabled(this.path, parsingMetadata);
      if (!detailedLogEnabled) {
        this.emitter.emit('error', 'Enable Detailed Logs!');
        return;
      }

      // TODO - Detect language
      // this.emitter.emit('language', 'INSERT LANGUAGE HERE');

      const [fileId, fileIdState] = await getFileId(this.path, detailedLogState, parsingMetadata);

      this.emitter.emit('status', 'Awaiting updates...');

      this.parseEvents(this.path, fileIdState, parsingMetadata).catch(e => {
        error('start.parseEvents', e);
        this.emitter.emit('error', String(e));
      });
    } catch (e) {
      error('start.getParsingMetadata', e);
      this.emitter.emit('error', String(e));
    }
  }

  public stop(): void {
    this.shouldStop = true;
  }

  public setPlayerId(plid: string, pname: string): void {}

  private async parseEvents(
    logPath: string,
    currentState: LogFileParsingState,
    parsingMetadata: ParsingMetadata
  ): Promise<void> {
    // Stop parsing when parser manually stopped
    if (this.shouldStop) {
      this.shouldStop = false;
      return;
    }

    // Fetching batch of events
    const [events, newState] = await getEvents(logPath, currentState, parsingMetadata);

    // Filter useless events
    const eventsToSend = removeUndefined(
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

    // Send parsing date
    if (eventsToSend.length > 0) {
      const lastEvent = eventsToSend[eventsToSend.length - 1];
      this.emitter.emit('status', `Log parsed till: ${format(new Date(lastEvent.time), 'h:mm:ss a dd, MMM yyyy')}`);
    }

    // Checking events
    for (const event of eventsToSend) {
      // case 'Client.Connected':
      // this.emitter.emit('userchange', this.newPlayerData);
      // case 'DuelScene.GameStart':
      // this.emitter.emit('match-started', {
      //   matchId: loginNfo.matchId,
      //   gameNumber: loginNfo.gameNumber,
      //   seatId: loginNfo.seatId,
      // });
      // case 'DuelScene.EndOfMatchReport':
      // this.emitter.emit('match-over', loginNfo.matchId);
      // if (gobj.type === 'GameObjectType_Card') {
      //   this.emitter.emit('card-played', {
      //     instanceId: parseFloat(gobj.instanceId),
      //     grpId: parseFloat(gobj.grpId),
      //     zoneId: parseFloat(gobj.zoneId),
      //     visibility: gobj.visibility,
      //     ownerSeatId: parseFloat(gobj.ownerSeatId),
      //   });
      // }
    }

    // Forwarding new data for server sending
    this.emitter.emit('newdata', {events: eventsToSend, state: newState});

    // End of parsing for old log
    if (this.parseOnce && eventsToSend.length === 0) {
      this.emitter.emit('old-log-complete', undefined);
      return;
    }

    // Triggering next batch
    const timeout = eventsToSend.length === 0 ? defaultTimeout : 0;
    await sleep(timeout);
    return this.parseEvents(logPath, newState, parsingMetadata);
  }
}
