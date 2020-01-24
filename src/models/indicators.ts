export interface Indicators {
  marker: number;
  Indicators: string;
  Send: string;
  Needrunning: string;
  Addup: string;
  Stopper: string;
  Needtohave: string;
  Ignore: string;
}

export interface ParseResults {
  time: number;
  indicator: number;
  json: string;
  uid: string;
  matchId: string;
  turnNumber: number;
}
