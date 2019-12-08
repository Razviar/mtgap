import {format} from 'date-fns';
import {app} from 'electron';
import {existsSync} from 'fs';
import {join} from 'path';

import {getParsingMetadata} from 'root/api/getindicators';
import {setuserdata, UserData} from 'root/api/userbytokenid';
import {setCreds} from 'root/app/auth';
import {checkDetailedLogEnabled} from 'root/app/log-parser/detailed_log';
import {getEvents} from 'root/app/log-parser/events';
import {getFileId} from 'root/app/log-parser/file_id';
import {LogFileParsingState, ParsingMetadata, StatefulLogEvent} from 'root/app/log-parser/model';
import {extractValue} from 'root/app/log-parser/parsing';
import {LogParserEventEmitter} from 'root/app/log_parser_events';
import {sendMessageToHomeWindow} from 'root/app/messages';
import {settingsStore} from 'root/app/settings_store';
import {getAccountFromScreenName} from 'root/app/userswitch';
import {error} from 'root/lib/logger';
import {asArray, asMap, asNumber, asString, removeUndefined} from 'root/lib/type_utils';

const defaultTimeout = 500;

export class LogParser2 {
  private readonly path: string;
  private readonly parseOnce: boolean = false;
  private shouldStop: boolean = false;
  private isRunning: boolean = false;

  public emitter = new LogParserEventEmitter();

  constructor(targetname: string[] | string, pathset?: boolean, parseOnce?: boolean) {
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
    if (this.isRunning) {
      error('Trying to start the parser while still running', undefined);
      return;
    }
    this.isRunning = true;
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

      const [fileId, fileIdState] = await getFileId(this.path, detailedLogState, parsingMetadata);

      this.emitter.emit('status', 'Awaiting updates...');

      this.parseEvents(this.path, fileIdState, parsingMetadata);
    } catch (e) {
      error('start.getParsingMetadata', e);
      this.emitter.emit('error', String(e));
      this.isRunning = false;
    }
  }

  public stop(): void {
    this.shouldStop = true;
    this.isRunning = false;
  }

  private parseEvents(logPath: string, currentState: LogFileParsingState, parsingMetadata: ParsingMetadata): void {
    // Stop parsing when parser manually stopped
    if (this.shouldStop) {
      this.shouldStop = false;
      return;
    }

    // Fetching batch of events
    getFileId(this.path, {bytesRead: 0}, parsingMetadata)
      .then(async ([fileId, fileIdState]) => {
        const isDifferentFileId = false;
        const newCurrentState = isDifferentFileId ? fileIdState : currentState;
        return getEvents(logPath, newCurrentState, parsingMetadata).then(([events, newState]) => {
          // Send parsing date
          if (events.length > 0) {
            const lastEvent = events[events.length - 1];
            if (lastEvent.timestamp !== undefined) {
              this.emitter.emit(
                'status',
                `Log parsed till: ${format(new Date(lastEvent.timestamp), 'h:mm:ss a dd, MMM yyyy')}`
              );
            }
          }

          // Checking events
          for (const event of events) {
            if (event.name === parsingMetadata.userChangeEvent) {
              this.handleUserChangeEvent(event);
            } else if (event.name === parsingMetadata.matchStartEvent) {
              this.handleMatchStartEvent(event);
            } else if (event.name === parsingMetadata.matchEndEvent) {
              this.handleMatchEndEvent(event);
            } else if (event.name === parsingMetadata.cardPlayedEvent) {
              this.handleCardPlayedEvent(event);
            } else if (event.name === parsingMetadata.deckSubmissionEvent) {
              this.handleDeckSubmissionEvent(event);
            }
          }

          // Filter useless events
          const eventsToSend = removeUndefined(
            events.map(e => {
              if (e.indicator === undefined) {
                return undefined;
              }
              const payload = asMap(e.rawData, {}).payload;
              const json = JSON.stringify(payload === undefined ? e.rawData : payload);
              return {
                time: e.timestamp === undefined ? 1 : e.timestamp,
                indicator: e.indicator,
                json,
                uid: e.userId === undefined ? '' : e.userId,
                matchId: e.matchId === undefined ? '' : e.matchId,
              };
            })
          );

          // Forwarding new data for server sending
          if (eventsToSend.length > 0) {
            this.emitter.emit('newdata', {events: eventsToSend, parsingMetadata, state: newState});
          }

          // End of parsing for old log
          if (this.parseOnce && events.length === 0) {
            this.isRunning = false;
            this.emitter.emit('old-log-complete', undefined);
            return;
          }

          // Triggering next batch
          const timeout = eventsToSend.length === 0 ? defaultTimeout : 0;
          setTimeout(() => {
            this.parseEvents(logPath, newState, parsingMetadata);
          }, timeout);
        });
      })
      .catch(err => {
        this.isRunning = false;
        error('start.parseEvents', err);
        this.emitter.emit('error', String(err));
      });
  }

  private handleUserChangeEvent(event: StatefulLogEvent): void {
    const account = settingsStore.getAccount();
    const newPlayerId = asString(extractValue(event.data, ['params', 'payloadObject', 'playerId']));
    const language = asString(
      extractValue(event.data, ['params', 'payloadObject', 'settings', 'language', 'language'])
    );
    const screenName = asString(extractValue(event.data, ['params', 'payloadObject', 'screenName']));
    if (language !== undefined) {
      this.emitter.emit('language', language);
    }
    if (newPlayerId === undefined || language === undefined || screenName === undefined) {
      error('Encountered invalid user change event', undefined, {...event});
      return;
    }
    sendMessageToHomeWindow('set-screenname', screenName);
    if (account && account.player && account.player.playerId === newPlayerId) {
      return;
    }
    // this.emitter.emit('userchange', {language, playerId: newPlayerId, screenName});

    sendMessageToHomeWindow('show-status', {message: 'New User Detected!', color: '#dbb63d'});

    // If account is defined, it enforces that awaiting is undefined, because account has a screenName
    const settings = settingsStore.get();
    const newAccount = getAccountFromScreenName(screenName);
    if (newAccount !== undefined && newAccount.player) {
      settings.userToken = newAccount.token;
      const userData: UserData = {
        mtgaId: newPlayerId,
        mtgaNick: screenName,
        language,
        token: newAccount.token,
      };
      const version = app.getVersion();
      setuserdata(userData).catch(err =>
        error('Failure to set user data during a user change event', err, {...userData, version})
      );
      setCreds('userchange');
    } else {
      sendMessageToHomeWindow('new-account', undefined);
      sendMessageToHomeWindow('show-prompt', {message: 'New MTGA account detected!', autoclose: 1000});
      settings.awaiting = {playerId: newPlayerId, screenName, language};
      this.stop();
    }

    settingsStore.save();
  }

  private handleMatchStartEvent(event: StatefulLogEvent): void {
    const matchId = asString(extractValue(event.data, ['params', 'payloadObject', 'matchId']));
    const gameNumber = asNumber(extractValue(event.data, ['params', 'payloadObject', 'gameNumber']));
    const seatId = asNumber(extractValue(event.data, ['params', 'payloadObject', 'seatId']));
    const eventId = asString(extractValue(event.data, ['params', 'payloadObject', 'eventId']));
    if (matchId === undefined || gameNumber === undefined || seatId === undefined || eventId === undefined) {
      error('Encountered invalid match start event', undefined, {...event});
      return;
    }
    this.emitter.emit('match-started', {matchId, gameNumber, seatId, eventId});
  }

  private handleMatchEndEvent(event: StatefulLogEvent): void {
    const matchId = asString(extractValue(event.data, ['params', 'payloadObject', 'matchId']));
    if (matchId === undefined) {
      error('Encountered invalid match end event', undefined, {...event});
      return;
    }
    this.emitter.emit('match-over', matchId);
  }

  private handleCardPlayedEvent(event: StatefulLogEvent): void {
    const instanceId = asNumber(extractValue(event.data, ['instanceId']));
    const grpId = asNumber(extractValue(event.data, ['grpId']));
    const zoneId = asNumber(extractValue(event.data, ['zoneId']));
    const visibility = asString(extractValue(event.data, ['visibility']));
    const ownerSeatId = asNumber(extractValue(event.data, ['ownerSeatId']));
    if (
      instanceId === undefined ||
      grpId === undefined ||
      zoneId === undefined ||
      visibility === undefined ||
      ownerSeatId === undefined
    ) {
      error('Encountered invalid card played event', undefined, {...event});
      return;
    }
    this.emitter.emit('card-played', {instanceId, grpId, zoneId, visibility, ownerSeatId});
  }

  private handleDeckSubmissionEvent(event: StatefulLogEvent): void {
    const mainDeckRaw = asArray<number>(extractValue(event.data, ['CourseDeck', 'mainDeck']));
    const commandZoneGRPIds = asArray<number>(extractValue(event.data, ['CourseDeck', 'commandZoneGRPIds']));
    const deckName = asString(extractValue(event.data, ['CourseDeck', 'name']));
    const deckId = asString(extractValue(event.data, ['CourseDeck', 'id']));
    const InternalEventName = asString(extractValue(event.data, ['InternalEventName']));
    if (
      mainDeckRaw === undefined ||
      commandZoneGRPIds === undefined ||
      deckName === undefined ||
      deckId === undefined ||
      InternalEventName === undefined
    ) {
      error('Encountered invalid deck submission event', undefined, {...event});
      return;
    }
    const mainDeck: {[index: number]: number} = {};
    let cid = 0;
    mainDeckRaw.forEach(deckEl => {
      if (+deckEl > 100) {
        cid = +deckEl;
      } else if (cid !== 0) {
        mainDeck[+cid] = +deckEl;
      }
    });

    this.emitter.emit('deck-submission', {mainDeck, commandZoneGRPIds, deckName, deckId, InternalEventName});
  }
}
