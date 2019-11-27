export interface LiveMatchRequest {
  matchid: string;
  uid: string;
}

export interface LiveMatch {
  deckstruct: {card: number; cardnum: number}[];
  humanname: string;
}

export class Match {
  public matchId: string = '';
  public mtgaUid: string = '';
  public ourUid: string = '';

  public over() {}

  public mycard() {}
}
