import {app} from 'electron';

import {getLorAPI} from 'root/api/LOR/localhost-getter';
import {getLORParsingMetadata} from 'root/api/LOR/lor-getindicators';
import {extractValue} from 'root/app/log-parser/parsing';
import {LogParserEventEmitter} from 'root/app/log_parser_events';
import {LorParsingMetadata, LorStateInfo} from 'root/app/lor-tracking/model';
import {error} from 'root/lib/logger';
import {asString} from 'root/lib/type_utils';

export class LorParser {
  private shouldStop: boolean = false;
  private isRunning: boolean = false;
  private readonly currentState: LorStateInfo = {
    lastEndpoint: -1,
    lastGameState: '',
    excludeEndpoints: [0],
    delayEndpoints: [0, 0, 10, 10],
    currentDelays: [],
  };

  public emitter = new LogParserEventEmitter();

  public async start(): Promise<void> {
    try {
      if (this.isRunning) {
        error('Trying to start the parser while still running', undefined);
        return;
      }
      this.isRunning = true;
      this.shouldStop = false;
      const parsingMetadata = await getLORParsingMetadata(app.getVersion());
      this.currentState.currentDelays.fill(0, 0, parsingMetadata.events.length);
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

  private checkIfExcluded(endpointIndex: number, length: number): number {
    while (this.currentState.excludeEndpoints.includes(endpointIndex)) {
      endpointIndex = endpointIndex < length - 1 ? endpointIndex + 1 : 0;
    }
    return endpointIndex;
  }

  private internalLoop(parsingMetadata: LorParsingMetadata): void {
    if (this.shouldStop) {
      return;
    }
    let endpointIndex =
      this.currentState.lastEndpoint < parsingMetadata.events.length - 1 ? this.currentState.lastEndpoint + 1 : 0;

    endpointIndex = this.checkIfExcluded(endpointIndex, parsingMetadata.events.length);

    if (this.currentState.currentDelays[endpointIndex] < this.currentState.delayEndpoints[endpointIndex]) {
      // console.log(
      //   `${this.currentState.currentDelays[endpointIndex]}/${this.currentState.delayEndpoints[endpointIndex]}`
      // );
      this.currentState.currentDelays[endpointIndex]++;
      endpointIndex = endpointIndex < parsingMetadata.events.length - 1 ? endpointIndex + 1 : 0;
      endpointIndex = this.checkIfExcluded(endpointIndex, parsingMetadata.events.length);
    } else {
      this.currentState.currentDelays[endpointIndex] = 0;
    }

    const endpoint = parsingMetadata.events[endpointIndex];

    getLorAPI(endpoint.name)
      .then((res) => {
        // console.log(this.currentState.lastEndpoint);
        // console.log(endpoint.name);
        // console.log(res);
        switch (endpoint.name) {
          case 'positional-rectangles':
            const PlayerName = asString(extractValue(res, ['PlayerName']));
            const gameState = asString(extractValue(res, ['GameState']));
            if (gameState === this.currentState.lastGameState) {
              break;
            }
            if (gameState === undefined) {
              break;
            }
            this.currentState.lastGameState = gameState;
            switch (gameState) {
              case 'InProgress':
                this.currentState.excludeEndpoints.splice(this.currentState.excludeEndpoints.indexOf(0), 1);
                break;
              default:
                break;
            }
            break;
          case 'static-decklist':
            const deckCode = asString(extractValue(res, ['DeckCode']));
            this.currentState.excludeEndpoints.push(0);
            // console.log(deckCode);

            break;
        }

        this.currentState.lastEndpoint = endpointIndex;
        setTimeout(() => this.internalLoop(parsingMetadata), parsingMetadata.logParser.readTimeout);
      })
      .catch((err) => {
        error('Failure to get data from API', err);
        this.currentState.lastEndpoint = endpointIndex;
        setTimeout(() => this.internalLoop(parsingMetadata), parsingMetadata.logParser.readTimeout);
      });

    // Triggering next batch
  }
}
