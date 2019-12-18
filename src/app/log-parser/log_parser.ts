import {format} from 'date-fns';
import {app} from 'electron';
import {stat} from 'fs';
import {join} from 'path';

import {getParsingMetadata} from 'root/api/getindicators';
import {getUserMetadata} from 'root/api/overlay';
import {setuserdata, UserData} from 'root/api/userbytokenid';
import {setCreds} from 'root/app/auth';
import {checkDetailedLogEnabled} from 'root/app/log-parser/detailed_log';
import {getEvents} from 'root/app/log-parser/events';
import {getFileId} from 'root/app/log-parser/file_id';
import {LogFileParsingState, ParsingMetadata, StatefulLogEvent} from 'root/app/log-parser/model';
import {extractValue} from 'root/app/log-parser/parsing';
import {LogParserEventEmitter} from 'root/app/log_parser_events';
import {sendMessageToHomeWindow, sendMessageToOverlayWindow} from 'root/app/messages';
import {gameIsRunning} from 'root/app/process_watcher';
import {settingsStore} from 'root/app/settings_store';
import {StateInfo, stateStore} from 'root/app/state_store';
import {getAccountFromScreenName} from 'root/app/userswitch';
import {error} from 'root/lib/logger';
import {asArray, asMap, asNumber, asString, removeUndefined} from 'root/lib/type_utils';

export class LogParser {
  private shouldStop: boolean = false;
  private isRunning: boolean = false;
  private currentState?: StateInfo;

  public emitter = new LogParserEventEmitter();

  constructor() {
    this.currentState = stateStore.get();
    if (this.currentState && this.currentState.state.screenName !== undefined) {
      sendMessageToHomeWindow('set-screenname', {
        screenName: this.currentState.state.screenName,
        newPlayerId: '',
      });
    }
  }

  private getPath(): string {
    const specialpath = settingsStore.get().logPath;
    if (specialpath !== undefined) {
      return specialpath;
    }
    return join(app.getPath('appData'), 'LocalLow', 'Wizards Of The Coast', 'MTGA', 'output_log.txt').replace(
      'Roaming\\',
      ''
    );
  }

  public async start(): Promise<void> {
    try {
      if (this.isRunning) {
        error('Trying to start the parser while still running', undefined);
        return;
      }
      this.isRunning = true;
      this.shouldStop = false;
      const parsingMetadata = await getParsingMetadata(app.getVersion());
      this.internalLoop(parsingMetadata);
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

  private internalLoop(parsingMetadata: ParsingMetadata): void {
    if (this.shouldStop) {
      return;
    }
    const path = this.getPath();
    stat(path, async err => {
      try {
        // File doesn't exist
        if (err) {
          throw new Error('No log file found');
        }

        // Fetching fileId
        const [fileId] = await getFileId(path, {bytesRead: 0}, parsingMetadata);

        // Detecting change in fileId
        let nextState: LogFileParsingState;
        if (!this.currentState || this.currentState.fileId !== fileId) {
          const [detailedLogEnabled, detailedLogState] = await checkDetailedLogEnabled(path, parsingMetadata);
          if (!detailedLogEnabled) {
            throw new Error('Enable Detailed Logs!');
          }
          nextState = detailedLogState;

          if (gameIsRunning) {
            // Updating UI
            this.emitter.emit('status', 'Awaiting updates...');
          }
        } else {
          nextState = this.currentState.state;
        }

        // Parsing events
        const [events, newState] = await getEvents(path, nextState, parsingMetadata);

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
          switch (event.name) {
            case parsingMetadata.userChangeEvent:
              this.handleUserChangeEvent(event);
              break;
            case parsingMetadata.matchStartEvent:
              this.handleMatchStartEvent(event);
              break;
            case parsingMetadata.matchEndEvent:
              this.handleMatchEndEvent(event);
              break;
            case parsingMetadata.cardPlayedEvent:
              this.handleCardPlayedEvent(event);
              break;
            case parsingMetadata.deckSubmissionEvent:
              this.handleDeckSubmissionEvent(event);
              break;
            case parsingMetadata.draftStartEvent:
              this.handleDraftEvents(event);
              break;
            case parsingMetadata.draftPickResponseEvent:
              this.handleDraftEvents(event);
              break;
            case parsingMetadata.draftMakePickEvent:
              this.handledraftMakePickEvents(event);
              break;
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
          this.emitter.emit('newdata', {events: eventsToSend, parsingMetadata, state: newState, fileId});
        }

        // Saving new state for next batch
        this.currentState = {fileId, state: newState};

        // Triggering next batch
        const timeout = eventsToSend.length === 0 ? parsingMetadata.logParser.readTimeout : 0;
        setTimeout(() => this.internalLoop(parsingMetadata), timeout);
      } catch (e) {
        this.emitter.emit('error', String(e));
        setTimeout(() => this.internalLoop(parsingMetadata), parsingMetadata.logParser.readTimeout);
      }
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
    sendMessageToHomeWindow('set-screenname', {screenName, newPlayerId});

    if (account && settingsStore.get().overlay) {
      getUserMetadata(+account.uid)
        .then(umd => sendMessageToOverlayWindow('set-userdata', umd))
        .catch(err => {
          error('Failure to load User Metadata', err);
        });
    }

    if (account && account.player && account.player.playerId === newPlayerId) {
      return;
    }

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
    //console.log('match-started');
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
    console.log(event);
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

  private handleDraftEvents(event: StatefulLogEvent): void {
    const DraftPack = asArray<number>(extractValue(event.data, ['DraftPack']), []);
    const PackNumber = asNumber(extractValue(event.data, ['PackNumber']));
    const PickNumber = asNumber(extractValue(event.data, ['PickNumber']));
    if (PackNumber === undefined || PickNumber === undefined) {
      error('Encountered invalid draft start event', undefined, {...event});
      return;
    }

    this.emitter.emit('draft-turn', {DraftPack, PackNumber, PickNumber});
  }

  private handledraftMakePickEvents(event: StatefulLogEvent): void {
    const PackNumber = asNumber(extractValue(event.data, ['PackNumber']));
    const PickNumber = asNumber(extractValue(event.data, ['PickNumber']));
    const PacksInDraft = 2;
    const CardsInPack = 13;
    if (PackNumber === PacksInDraft || PickNumber === CardsInPack) {
      this.emitter.emit('draft-complete', undefined);
    }
  }
}
