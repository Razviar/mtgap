export interface LiveMatchRequest {
  matchid: string;
  uid: string;
}

export interface LiveMatch {
  deckstruct: {card: number; cardnum: number}[];
  humanname: string;
}

export interface CardPlayedResult {
  affectedcards: number[];
  myDeck: boolean;
}

export interface CardMappings {
  me: {[index: number]: number};
  opponent: {[index: number]: number};
}

export interface CardPlayedNfo {
  grpId: number;
  instanceId: number;
  ownerSeatId: number;
  zoneId: number;
}

export class Match {
  public matchId: string = '';
  public mtgaUid: string = '';
  public ourUid: string = '';
  public zones: {[index: number]: number} = {};
  public instanceIds: CardMappings = {me: {}, opponent: {}};
  public decks: CardMappings = {me: {}, opponent: {}};
  public myFullDeck: {card: number; cardnum: number}[] = [];
  public humanname: string = '';
  public myTeamId: number = 0;
  public TurnNumber: number = 0;
  public GameNumber: number = 0;
  public DecisionPlayer: number = 0;

  public mulligan(): void {
    this.instanceIds.me = {};
    this.decks.me = {};
  }

  public over(): void {
    this.matchId = '';
    this.mtgaUid = '';
    this.ourUid = '';
    this.zones = {};
    this.instanceIds = {me: {}, opponent: {}};
    this.decks = {me: {}, opponent: {}};
    this.myFullDeck = [];
    this.humanname = '';
    this.myTeamId = 0;
    this.TurnNumber = 0;
    this.GameNumber = 0;
    this.DecisionPlayer = 0;
  }

  public cardplayed({grpId, instanceId, ownerSeatId, zoneId}: CardPlayedNfo): CardPlayedResult {
    const ZoneTypeBattlefield = 28;
    const ZoneTypeHandPl1 = 31;
    const ZoneTypeHandPl2 = 35;
    const ZoneTypeStack = 27;
    const cardOperation: 'me' | 'opponent' = ownerSeatId !== this.myTeamId ? 'opponent' : 'me';
    const ZoneOfInterest =
      cardOperation === 'opponent'
        ? [ZoneTypeBattlefield, ZoneTypeStack]
        : ownerSeatId === 1
        ? [ZoneTypeHandPl1]
        : [ZoneTypeHandPl2];
    const affectedcards: number[] = [];
    this.zones[instanceId] = zoneId;
    /*if (cardOperation === 'opponent') {
      console.log('----------------');
      console.log(ZoneOfInterest);
      console.log({grpId, instanceId, ownerSeatId, zoneId});
    }*/
    if (this.instanceIds[cardOperation][instanceId] !== grpId) {
      this.instanceIds[cardOperation][instanceId] = grpId;
      if (ZoneOfInterest.includes(+zoneId)) {
        /*if (cardOperation === 'opponent') {
          console.log('*');
        }*/
        affectedcards.push(grpId);
        if (this.decks[cardOperation][grpId] > 0) {
          this.decks[cardOperation][grpId]++;
        } else {
          /*if (cardOperation === 'opponent') {
            console.log('***');
          }*/
          this.decks[cardOperation][grpId] = 1;
        }
      }
      /*if (cardOperation === 'opponent') {
        console.log(this.decks);
        console.log(this.instanceIds);
        console.log(this.zones);
      }*/
    }
    //console.log(affectedcards);
    return {affectedcards, myDeck: ownerSeatId === this.myTeamId};
  }
}
