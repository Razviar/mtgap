import {CardPlayed} from 'root/models/cards';
import {ParseResults} from 'root/models/indicators';

export interface PlayerData {
  playerId: string;
  screenName: string;
  language: string;
}

interface LogParserEvents {
  error: string;
  language: string;
  status: string;
  'old-log-complete': undefined;
  userchange: PlayerData;
  'match-started': {
    matchId: string;
    seatId: number;
    gameNumber: number;
  };
  'match-over': string;
  'card-played': CardPlayed;
  newdata: ParseResults[];
}

type LogParserListener<Event extends keyof LogParserEvents> = (data: LogParserEvents[Event]) => void;

export class LogParserEventEmitter {
  // tslint:disable-next-line:no-any
  private readonly listeners = new Map<string, ((data: any) => void)[]>();

  public on<Event extends keyof LogParserEvents>(event: Event, listener: LogParserListener<Event>): void {
    const listeners = this.listeners.get(event);
    if (listeners === undefined) {
      this.listeners.set(event, [listener]);
    } else {
      listeners.push(listener);
    }
  }

  public off<Event extends keyof LogParserEvents>(event: Event, listener: LogParserListener<Event>): void {
    const listeners = this.listeners.get(event);
    if (listeners === undefined) {
      return;
    }
    const index = listeners.indexOf(listener);
    if (index === -1) {
      return;
    }
    listeners.splice(index, 1);
  }

  public emit<Event extends keyof LogParserEvents>(event: Event, data: LogParserEvents[Event]): void {
    const listeners = this.listeners.get(event);
    if (listeners === undefined) {
      return;
    }
    listeners.forEach(listener => listener(data));
  }
}
