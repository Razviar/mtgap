export interface LiveMatchRequest {
  matchid: string;
  uid: number;
}

export interface LiveMatch {
  deckstruct: {card: number; cardnum: number}[];
  humanname: string;
}

interface CardMappings {
  me: {[index: number]: number};
  opponent: {[index: number]: number};
}

export class Match {
  public matchId: string = '';
  public mtgaUid: string = '';
  public ourUid: number = 0;
  public zones: {[index: number]: number} = {};
  public instanceIds: CardMappings = {me: {}, opponent: {}};
  public decks: CardMappings = {me: {}, opponent: {}};
  public myFullDeck: {card: number; cardnum: number}[] = [];
  public humanname: string = '';
  public myTeamId: number = 0;
  public TurnNumber: number = 0;
  public GameNumber: number = 0;
  public DecisionPlayer: number = 0;

  public over(): void {
    this.matchId = '';
    this.mtgaUid = '';
    this.ourUid = 0;
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

  public cardplayed(grpId: number, instanceId: number, ownerSeatId: number, zoneId: number): number[] {
    const ZoneTypeBattlefield = 28;
    const ZoneTypeHandPl1 = 31;
    const ZoneTypeHandPl2 = 35;
    const ZonesOfInterest = [ZoneTypeBattlefield, ZoneTypeHandPl1, ZoneTypeHandPl2];
    const cardOperation: 'me' | 'opponent' = ownerSeatId !== this.myTeamId ? 'opponent' : 'me';
    const cardFirstTimeSpotted: boolean = !(this.zones[instanceId] > 0);
    const affectedcards: number[] = [];
    console.log('----------------');
    this.zones[instanceId] = zoneId;
    if (this.instanceIds[cardOperation][instanceId] !== grpId) {
      this.instanceIds[cardOperation][instanceId] = grpId;
      if (ZonesOfInterest.includes(zoneId) && cardFirstTimeSpotted) {
        affectedcards.push(grpId);
        if (this.decks[cardOperation][grpId] > 0) {
          this.decks[cardOperation][grpId]++;
        } else {
          this.decks[cardOperation][grpId] = 1;
        }
      }

      console.log(this.decks);
      console.log(this.instanceIds);
      console.log(this.zones);
    }
    console.log(affectedcards);
    return affectedcards;
  }
}
