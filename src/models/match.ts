export interface LiveMatchRequest {
  matchid: string;
  uid: number;
}

export interface LiveMatch {
  deckstruct: { [index: number]: number };
  humanname: string;
}

export class Match {
  public matchId: string = '';
  public mtgaUid: string = '';
  public ourUid: number = 0;

  public over() {}

  public mycard() {}
}
