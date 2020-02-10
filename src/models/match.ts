export interface DeckStrorage {
  [index: string]: CourseDeck;
}

export interface CourseDeck {
  commandZoneGRPIds?: number[];
  mainDeck: {card: number; cardnum: number}[];
  deckName: string;
  deckId: string;
}

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
  public myBestFirstCard: number = 0;
  public myWorstFirstCard: number = 0;
  public humanname: string = '';
  public eventId: string = '';
  public myTeamId: number = 0;
  public TurnNumber: number = 0;
  public GameNumber: number = 0;
  public timers: {me: number; opponent: number} = {me: 0, opponent: 0};
  public DecisionPlayer: number = 0;
  public totalCards: number = 0;
  public cardsBySuperclass: Map<string, number> = new Map();
  public cardsBySuperclassLeft: Map<string, number> = new Map();
  public lands: Map<string, number> = new Map();
  public landsLeft: Map<string, number> = new Map();
  public basicLands: Map<string, number> = new Map();
  public basicLandsLeft: Map<string, number> = new Map();

  public mulligan(): void {
    this.instanceIds.me = {};
    this.decks.me = {};
  }

  public over(): void {
    this.matchId = '';
    this.mtgaUid = '';
    this.ourUid = '';
    this.eventId = '';
    this.zones = {};
    this.instanceIds = {me: {}, opponent: {}};
    this.decks = {me: {}, opponent: {}};
    this.myFullDeck = [];
    this.myBestFirstCard = 0;
    this.myWorstFirstCard = 0;
    this.humanname = '';
    this.myTeamId = 0;
    this.TurnNumber = 0;
    this.GameNumber = 0;
    this.DecisionPlayer = 0;
    this.cardsBySuperclass.clear();
    this.cardsBySuperclassLeft.clear();
    this.lands.clear();
    this.landsLeft.clear();
    this.basicLands.clear();
    this.basicLandsLeft.clear();
    this.totalCards = 0;
    this.timers = {me: 0, opponent: 0};
  }

  public cardplayed({grpId, instanceId, ownerSeatId, zoneId}: CardPlayedNfo): CardPlayedResult {
    if (ownerSeatId === 0) {
      return {affectedcards: [], myDeck: false};
    }

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
    if (this.instanceIds[cardOperation][instanceId] !== grpId) {
      this.instanceIds[cardOperation][instanceId] = grpId;
      if (ZoneOfInterest.includes(+zoneId)) {
        affectedcards.push(grpId);
        if (this.decks[cardOperation][grpId] > 0) {
          this.decks[cardOperation][grpId]++;
        } else {
          this.decks[cardOperation][grpId] = 1;
        }
      }
    }
    return {affectedcards, myDeck: ownerSeatId === this.myTeamId};
  }

  public switchTimer(decisionPlayer: number): void {
    this.DecisionPlayer = decisionPlayer;
  }

  public tick(): void {
    const timerOperation: 'me' | 'opponent' = this.DecisionPlayer !== this.myTeamId ? 'opponent' : 'me';
    this.timers[timerOperation]++;
  }
}
