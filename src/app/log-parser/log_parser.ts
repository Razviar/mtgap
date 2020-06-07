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
import {getUserCredentials} from 'root/app/log-parser/getusercredentials';
import {initialpositioner} from 'root/app/log-parser/initialpositioner';
import {LogFileParsingState, ParsingMetadata, StatefulLogEvent} from 'root/app/log-parser/model';
import {extractValue, parseAsJSONIfNeeded} from 'root/app/log-parser/parsing';
import {LogParserEventEmitter} from 'root/app/log_parser_events';
import {sendMessageToHomeWindow, sendMessageToOverlayWindow} from 'root/app/messages';
import {locateMostRecentDate} from 'root/app/mtga_dir_ops';
import {oldStore} from 'root/app/old_store';
import {getOverlayWindow} from 'root/app/overlay_window';
import {settingsStore} from 'root/app/settings-store/settings_store';
import {StateInfo, stateStore} from 'root/app/state_store';
import {getAccountFromScreenName} from 'root/app/userswitch';
import {error} from 'root/lib/logger';
import {asArray, asMap, asNumber, asString, removeUndefined, asBoolean} from 'root/lib/type_utils';
import {ProcessWatching} from 'root/main';

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
    return join(app.getPath('appData'), 'LocalLow', 'Wizards Of The Coast', 'MTGA', 'Player.log').replace(
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
    const LogFromMTGAFolder = locateMostRecentDate();
    stat(path, async (err) => {
      try {
        // File doesn't exist
        if (err) {
          this.emitter.emit('nologfile', undefined);
          throw new Error('No log file found');
        }

        // Fetching fileId
        //const [fileId] = await getFileId(path, {bytesRead: 0}, parsingMetadata);
        const fileId = LogFromMTGAFolder.fileId;
        if (fileId === undefined || LogFromMTGAFolder.logPath === undefined) {
          throw new Error('Issue with MTGA path access...');
        }
        //console.log(fileId);

        const [userCreds] = await getUserCredentials(LogFromMTGAFolder.logPath, {bytesRead: 0}, parsingMetadata);
        //console.log(userCreds);

        if (!this.handleUserChangeEvent(userCreds.AccountID, userCreds.DisplayName)) {
          throw new Error('Parsing paused: new user account must be synced or skipped');
        }

        // Detecting change in fileId
        let nextState: LogFileParsingState;
        if (!this.currentState || this.currentState.fileId !== fileId) {
          const [detailedLogEnabled, detailedLogState] = await checkDetailedLogEnabled(path, parsingMetadata);
          if (!detailedLogEnabled) {
            throw new Error('Enable Detailed Logs in MTGA account settings!');
          }
          nextState = detailedLogState;
          nextState.bytesRead = await initialpositioner(path, userCreds.AccountID, parsingMetadata);
          oldStore.saveFileID(new Date().getTime(), fileId);

          if (!ProcessWatching.gameRunningState) {
            ProcessWatching.gameRunningState = true;
            clearInterval(ProcessWatching.interval);
            ProcessWatching.interval = setInterval(
              ProcessWatching.processWatcherFn,
              ProcessWatching.processWatcherFnInterval
            );
          }
        } else {
          nextState = this.currentState.state;
        }

        nextState.screenName = userCreds.DisplayName;
        nextState.userId = userCreds.AccountID;

        // Parsing events
        const [events, newState] = await getEvents(path, nextState, parsingMetadata);

        // Send parsing date
        if (events.length > 0) {
          const lastEvent = events[events.length - 1];
          if (lastEvent.timestamp !== undefined) {
            this.emitter.emit(
              'status',
              `<div class="stringTitle">Log parsed till:</div>${format(
                new Date(lastEvent.timestamp),
                'h:mm:ss a dd, MMM yyyy'
              )}`
            );
          }
        }

        /*if (events.length > 0) {
          console.log(events);
        }*/

        //console.log(parsingMetadata.matchStartEvent);

        // Checking events
        for (const event of events) {
          switch (event.name) {
            case parsingMetadata.deckMessage:
              this.handleDeckMessage(event);
              break;
            case parsingMetadata.AIPracticeDeckSubmit:
              this.handleAIPracticeDeckSubmit(event);
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
            case parsingMetadata.mulliganEvent:
              this.handleMulliganEvent(event);
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
            case parsingMetadata.humanDraftEvent:
              this.handlehumanDraftEvent(event);
              break;
            case parsingMetadata.humanDraftPick:
              this.handlehumandraftMakePickEvents(event);
              break;
            case parsingMetadata.draftMakePickEvent:
              this.handledraftMakePickEvents(event);
              break;
            case parsingMetadata.TurnInfoAllEvent:
              this.handleTurnInfoAllEvent(event);
              break;
          }
        }

        // Filter useless events
        const eventsToSend = removeUndefined(
          events.map((e) => {
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
              turnNumber: e.turnNumber === undefined ? 0 : e.turnNumber,
              lifeTotals: {
                pl1: e.lifeTotals?.pl1 === undefined ? 0 : e.lifeTotals.pl1,
                pl2: e.lifeTotals?.pl2 === undefined ? 0 : e.lifeTotals.pl2,
              },
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

  private handleUserChangeEvent(newPlayerId: string, screenName: string): boolean {
    const account = settingsStore.getAccount();

    if (!this.currentState || this.currentState.state.userId !== newPlayerId) {
      sendMessageToHomeWindow('set-screenname', {screenName, newPlayerId});
      /*console.log('setting screename');
      console.log(screenName);*/
      const overlayWindow = getOverlayWindow();
      if (account && settingsStore.get().overlay && overlayWindow !== undefined) {
        getUserMetadata(+account.uid)
          .then((umd) => sendMessageToOverlayWindow('set-userdata', umd))
          .catch((err) => {
            error('Failure to load User Metadata', err, {...account});
          });
      }
    }

    if (account && account.player && account.player.playerId === newPlayerId) {
      return true;
    }

    sendMessageToHomeWindow('show-status', {message: 'New User Detected!', color: '#dbb63d'});

    // If account is defined, it enforces that awaiting is undefined, because account has a screenName
    const settings = settingsStore.get();
    const newAccount = getAccountFromScreenName(screenName);
    if (newAccount !== undefined && newAccount.player) {
      if (settings.userToken !== undefined) {
        settings.userToken.mtga = newAccount.token;
      } else {
        settings.userToken = {mtga: newAccount.token};
      }
      const userData: UserData = {
        mtgaId: newPlayerId,
        mtgaNick: screenName,
        token: newAccount.token,
      };
      const version = app.getVersion();
      setuserdata(userData).catch((err) =>
        error('Failure to set user data during a user change event', err, {...userData, version})
      );
      setCreds('userchange');
    } else {
      sendMessageToHomeWindow('new-account', undefined);
      sendMessageToHomeWindow('show-prompt', {message: 'New MTGA account detected!', autoclose: 1000});
      settings.awaiting = {playerId: newPlayerId, screenName};
      this.stop();
    }

    settingsStore.save();
    return false;
  }

  private handleMatchStartEvent(event: StatefulLogEvent): void {
    //console.log(event);
    const matchId = asString(extractValue(event.data, ['gameRoomInfo', 'gameRoomConfig', 'matchId']));
    const state = asString(extractValue(event.data, ['gameRoomInfo', 'stateType']));
    const eventId = asString(extractValue(event.data, ['gameRoomInfo', 'gameRoomConfig', 'eventId']));

    /*console.log(matchId);
    console.log(state);
    console.log(eventId);*/

    if (state === 'MatchGameRoomStateType_Playing') {
      const players = asArray(extractValue(event.data, ['gameRoomInfo', 'gameRoomConfig', 'reservedPlayers']));
      if (players === undefined) {
        error('Encountered invalid match start event', undefined, {...event});
        return;
      }
      let seatId = 0;

      players.forEach((player) => {
        const userId = asString(extractValue(player, ['userId']));
        const teamId = asNumber(extractValue(player, ['teamId']));
        if (userId === this.currentState?.state.userId && teamId !== undefined) {
          seatId = teamId;
        }
      });

      if (matchId === undefined || eventId === undefined) {
        error('Encountered invalid match start event', undefined, {...event});
        return;
      }

      //console.log({matchId, gameNumber: 1, seatId, eventId});

      this.emitter.emit('match-started', {matchId, gameNumber: 1, seatId, eventId});
    }

    /*const matchId = asString(extractValue(event.data, ['payload', 'matchId']));
    const gameNumber = asNumber(extractValue(event.data, ['payload', 'gameNumber']));
    const seatId = asNumber(extractValue(event.data, ['payload', 'seatId']));
    const eventId = asString(extractValue(event.data, ['payload', 'eventId']));
    if (matchId === undefined || gameNumber === undefined || seatId === undefined || eventId === undefined) {
      error('Encountered invalid match start event', undefined, {...event});
      return;
    }
    //console.log('match-started');
    this.emitter.emit('match-started', {matchId, gameNumber, seatId, eventId});*/
  }

  private handleMatchEndEvent(event: StatefulLogEvent): void {
    /*const matchId = asString(extractValue(event.data, ['params', 'payloadObject', 'matchId']));
    if (matchId === undefined) {
      error('Encountered invalid match end event', undefined, {...event});
      return;
    }*/
    this.emitter.emit('match-over', undefined);
  }

  private handleMulliganEvent(event: StatefulLogEvent): void {
    const mulliganCount = asNumber(extractValue(event.data, ['mulliganCount']));
    if (mulliganCount !== undefined && mulliganCount > 0) {
      this.emitter.emit('mulligan', true);
    }
  }

  private handleCardPlayedEvent(event: StatefulLogEvent): void {
    //console.log(event);
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
      //error('Encountered invalid card played event', undefined, {...event});
      return;
    }
    this.emitter.emit('card-played', {instanceId, grpId, zoneId, visibility, ownerSeatId});
  }

  private handleDeckMessage(event: StatefulLogEvent): void {
    const mainDeckRaw = asArray<number>(extractValue(event.data, ['deckCards']));
    const mainDeck: {[index: number]: number} = {};

    if (mainDeckRaw === undefined) {
      error('Encountered invalid deck message', undefined, {...event});
      return;
    }

    mainDeckRaw.forEach((deckEl) => {
      // tslint:disable-next-line: strict-type-predicates
      if (mainDeck[+deckEl] !== undefined) {
        mainDeck[+deckEl]++;
      } else {
        mainDeck[+deckEl] = 1;
      }
    });
    //console.log(mainDeck);
    this.emitter.emit('deck-message', mainDeck);
  }

  private handleAIPracticeDeckSubmit(event: StatefulLogEvent): void {
    const deck = parseAsJSONIfNeeded(asString(extractValue(event.data, ['params', 'deck'])));
    const mainDeckRaw = asArray<number>(extractValue(deck, ['mainDeck']));
    const commandZoneGRPIds = asArray<number>(extractValue(deck, ['commandZoneGRPIds']));
    const deckName = asString(extractValue(deck, ['name']));
    const deckId = asString(extractValue(deck, ['id']));
    const InternalEventName = 'AIBotMatch';
    if (
      mainDeckRaw === undefined ||
      commandZoneGRPIds === undefined ||
      deckName === undefined ||
      deckId === undefined
    ) {
      error('Encountered invalid deck submission event', undefined, {...event});
      return;
    }
    const mainDeck: {[index: number]: number} = {};
    let cid = 0;
    mainDeckRaw.forEach((deckEl) => {
      if (+deckEl > 100) {
        cid = +deckEl;
      } else if (cid !== 0) {
        mainDeck[+cid] = +deckEl;
      }
    });

    this.emitter.emit('deck-submission', {mainDeck, commandZoneGRPIds, deckName, deckId, InternalEventName});
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
    mainDeckRaw.forEach((deckEl) => {
      if (+deckEl > 100) {
        cid = +deckEl;
      } else if (cid !== 0) {
        mainDeck[+cid] = +deckEl;
      }
    });

    this.emitter.emit('deck-submission', {mainDeck, commandZoneGRPIds, deckName, deckId, InternalEventName});
  }

  private handlehumanDraftEvent(event: StatefulLogEvent): void {
    const DraftPackString = asString(extractValue(event.data, ['PackCards']))?.split(',');
    const PackNumber = asNumber(extractValue(event.data, ['SelfPack']));
    const PickNumber = asNumber(extractValue(event.data, ['SelfPick']));
    if (PackNumber === undefined || PickNumber === undefined || DraftPackString === undefined) {
      error('Encountered invalid draft start event', undefined, {...event});
      return;
    }

    const DraftPack: number[] = [];

    DraftPackString.forEach((cid) => {
      DraftPack.push(+cid);
    });

    this.emitter.emit('draft-turn', {DraftPack, PackNumber, PickNumber});
  }

  private handleDraftEvents(event: StatefulLogEvent): void {
    const DraftPack = asArray<number>(extractValue(event.data, ['DraftPack']), []);
    const PackNumber = asNumber(extractValue(event.data, ['PackNumber']));
    const PickNumber = asNumber(extractValue(event.data, ['PickNumber']));
    if (PackNumber === undefined || PickNumber === undefined) {
      error('Encountered invalid draft start event', undefined, {...event});
      return;
    }

    if (PackNumber === 0 && PickNumber === 0) {
      const account = settingsStore.getAccount();
      const overlayWindow = getOverlayWindow();
      if (account && settingsStore.get().overlay && overlayWindow !== undefined) {
        getUserMetadata(+account.uid)
          .then((umd) => sendMessageToOverlayWindow('set-userdata', umd))
          .catch((err) => {
            error('Failure to load User Metadata', err, {...account});
          });
      }
    }

    this.emitter.emit('draft-turn', {DraftPack, PackNumber, PickNumber});
  }

  private handlehumandraftMakePickEvents(event: StatefulLogEvent): void {
    const IsPickingCompleted = asBoolean(extractValue(event.data, ['IsPickingCompleted']));
    if (IsPickingCompleted) {
      this.emitter.emit('draft-complete', undefined);
    }
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

  private handleTurnInfoAllEvent(event: StatefulLogEvent): void {
    const decisionPlayer = asNumber(extractValue(event.data, ['decisionPlayer']), 0);
    this.emitter.emit('turn-info', {decisionPlayer, turnNumber: event.turnNumber});
  }
}
