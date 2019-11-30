import {Card} from 'root/models/cards';

export interface Metadata {
  exps: {[index: number]: {code: string; currentstandard: number; name: string}};
  expsorder: number[];
  formats: {
    ClosedTime: number;
    DeckSelect: string;
    EntryFees: string;
    LockedTime: number;
    MaxLosses: number;
    MaxWins: number;
    PublicEventName: string;
    StartTime: number;
    date: number;
    format: string;
    name: string;
  };
  datefilters: number[];
  datefilterlabels: string[];
  types: {id: number; is_creature: number; name: string; parent_id: number}[];
  archetypes: {id: number; name: string; supertype: number}[];
  allcards: {[index: number]: Card};
  mtgatoinnerid: {[index: number]: number};
  trackerver: {version: number; date: number};
  headerbanners: string[];
}

export interface UserMetadata {
  user: Userdata;
  collection: {[index: number]: {[index: string]: string}};
  usercapabilities: {[index: string]: boolean};
}

export interface Userdata {
  user_id: number;
  lang: string;
  cardimagestype: number;
  pledge: number;
}
