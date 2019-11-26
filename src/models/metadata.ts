<<<<<<< HEAD
import {getMetadata} from 'root/api/overlay';
import {Card} from 'root/models/cards';

export interface Metadata {
  exps: {[index: number]: {code: string; currentstandard: number; name: string}};
=======
import { Card } from './cards';
import { getMetadata } from 'root/api/overlay';

export interface Metadata {
  exps: { [index: number]: { code: string; currentstandard: number; name: string } };
>>>>>>> f50c09694b48994ce41d459833507ce3daa89ed2
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
<<<<<<< HEAD
  types: {id: number; is_creature: number; name: string; parent_id: number}[];
  archetypes: {id: number; name: string; supertype: number}[];
  allcards: {[index: number]: Card};
  trackerver: {version: number; date: number};
=======
  types: { id: number; is_creature: number; name: string; parent_id: number }[];
  archetypes: { id: number; name: string; supertype: number }[];
  allcards: { [index: number]: Card };
  trackerver: { version: number; date: number };
>>>>>>> f50c09694b48994ce41d459833507ce3daa89ed2
  headerbanners: string[];
}

export interface UserMetadata {
  user: Userdata;
<<<<<<< HEAD
  collection: {[index: number]: {[index: string]: string}};
  usercapabilities: {[index: string]: boolean};
=======
  collection: { [index: number]: { [index: string]: string } };
  usercapabilities: { [index: string]: boolean };
>>>>>>> f50c09694b48994ce41d459833507ce3daa89ed2
}

export interface Userdata {
  user_id: number;
  lang: string;
  cardimagestype: number;
  pledge: number;
}

export class MetadataStore {
  public meta: Metadata | undefined;
  constructor(version: string) {
    getMetadata(version).then(res => {
      console.log(res);
      this.meta = res;
    });
  }
}
