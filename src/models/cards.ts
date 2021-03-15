export interface Card {
  id: number;
  doublelink: number;
  cardid: string;
  multiverseid: number;
  name: string;
  slug: string;
  kw: string;
  flavor: string;
  power: number;
  market: number;
  toughness: number;
  expansion: number;
  rarity: number;
  mana: string;
  convmana: number;
  text: string;
  loyalty: number;
  type: number;
  subtype: number;
  txttype: string;
  pict: string;
  date_in: number;
  colorindicator: string;
  mtga_id: number;
  is_collectible: number;
  reprint: number;
  draftrate: number;
  drafteval: number;
  is_land: number;
  colorarr: string;
  currentstandard: number;
  currenthistoric: number;
  art: string;
  has_hiresimg: number;
  willbeoutsoon: number;
  drafteval2: number;
  wleval: number;
  battleusage: number;
  wleval_draft: number;
  battleusage_draft: number;
  is_boostable: number;
  is_craftable: number;
  TraditionalStandardBan: number;
  TraditionalHistoricBan: number;
  StandardBan: number;
  HistoricBan: number;
  wleval_1sthand: number;
}

export interface Cardnfo {
  battleusage: number;
  battleusage_draft: number;
  drafteval2: number;
  id: number;
  market: number;
  mtga_id: number;
  reprints: number[];
  wleval: number;
  wleval_draft: number;
}

export interface Expcount {
  cardcount: number;
  rar_1: number;
  rar_2: number;
  rar_3: number;
  rar_4: number;
}

export interface CardFilterResult {
  data: Cardnfo[];
  maxdrafteval2: number;
  maxprice: number;
  maxusage: number;
  minusage: number;
  maxusagedraft: number;
  minusagedraft: number;
  maxwleval: number;
  maxwleval_draft: number;
  mindrafteval2: number;
  minwleval: number;
  minwleval_draft: number;
}

export interface CardRequestFilters {
  color: string[];
  expansion: string;
  mana: string;
  type: string;
  subtype: string;
  rarity: string;
  rulings: string;
  srt: string;
  direct: string;
  smrtsrhc: string;
  collection?: string;
  booster: string;
  TraditionalStandardBan: string;
  TraditionalHistoricBan: string;
  StandardBan: string;
  HistoricBan: string;
}

export interface CardFilterReq {
  direct: number;
  filter: {[index: string]: string[] | number[]};
  lib: number;
  limit: number;
  page: number;
  srt: number;
}

export interface CardPriceData {
  date: string;
  bid: number;
  ask: number;
  market: number;
}

export interface CardPlayed {
  grpId: number;
  instanceId: number;
  ownerSeatId: number;
  visibility: string;
  zoneId: number;
}
