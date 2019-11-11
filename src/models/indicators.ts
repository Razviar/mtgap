export interface Indicators {
  marker: number;
  Indicators: string;
  Send: boolean;
  Needrunning: boolean;
  Addup: boolean;
  Stopper: string;
  Needtohave: string;
  Ignore: string;
}

export interface ParseResults {
  time: number;
  indicator: number;
  json: string;
}
