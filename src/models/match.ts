export interface LiveMatchRequest {
  matchid: string;
  uid: number;
}

export interface LiveMatch {
<<<<<<< HEAD
  deckstruct: {card: number; cardnum: number}[];
=======
  deckstruct: { card: number; cardnum: number }[];
>>>>>>> f50c09694b48994ce41d459833507ce3daa89ed2
  humanname: string;
}

export class Match {
  public matchId: string = '';
  public mtgaUid: string = '';
  public ourUid: number = 0;

  public over() {}

  public mycard() {}
}
