import {AxiosResponse} from 'root/app/request';
import {error} from 'root/lib/logger';
import {asArray, asMap, asNumber, asString, removeUndefined} from 'root/lib/type_utils';
import {Card} from 'root/models/cards';
import {Metadata} from 'root/models/metadata';

export function parseMetadata(data: AxiosResponse): Metadata {
  const dataMap = asMap(data);
  if (dataMap === undefined) {
    error('Error while parsing a LiveMatch: not an object', undefined, {data});
    return {
      exps: {},
      expsorder: [],
      formats: [],
      datefilters: [],
      datefilterlabels: [],
      types: [],
      archetypes: [],
      allcards: [],
      mtgatoinnerid: {},
      trackerver: {version: 0, date: 0},
      headerbanners: [],
    };
  }
  const expsMap = asMap(dataMap.exps);
  const exps: {
    [index: number]: {
      code: string;
      currentstandard: number;
      name: string;
    };
  } = {};
  if (expsMap !== undefined) {
    Object.keys(expsMap).forEach((elem) => {
      const expElem = asMap(expsMap[elem]);
      if (expElem !== undefined) {
        const code = asString(expElem.code, '');
        const currentstandard = asNumber(expElem.currentstandard, 0);
        const name = asString(expElem.name, '');
        exps[+elem] = {code, currentstandard, name};
      }
    });
  }
  const formatsArr = asArray(dataMap.formats, []);
  const formats = removeUndefined(
    formatsArr.map((item) => {
      const itemMap = asMap(item);
      if (itemMap === undefined) {
        return undefined;
      }
      const ClosedTime = asNumber(itemMap.ClosedTime, 0);
      const DeckSelect = asString(itemMap.DeckSelect, '');
      const EntryFees = asString(itemMap.EntryFees, '');
      const LockedTime = asNumber(itemMap.LockedTime, 0);
      const MaxLosses = asNumber(itemMap.MaxLosses, 0);
      const MaxWins = asNumber(itemMap.MaxWins, 0);
      const PublicEventName = asString(itemMap.PublicEventName, '');
      const StartTime = asNumber(itemMap.StartTime, 0);
      const date = asNumber(itemMap.date, 0);
      const format = asString(itemMap.format, '');
      const name = asString(itemMap.name, '');
      return {
        ClosedTime,
        DeckSelect,
        EntryFees,
        LockedTime,
        MaxLosses,
        MaxWins,
        PublicEventName,
        StartTime,
        date,
        format,
        name,
      };
    })
  );
  const typesArr = asArray(dataMap.types, []);
  const types = removeUndefined(
    typesArr.map((item) => {
      const itemMap = asMap(item);
      if (itemMap === undefined) {
        return undefined;
      }
      const id = asNumber(itemMap.id, 0);
      // tslint:disable-next-line: variable-name
      const is_creature = asNumber(itemMap.is_creature, 0);
      const name = asString(itemMap.name, '');
      // tslint:disable-next-line: variable-name
      const parent_id = asNumber(itemMap.parent_id, 0);
      return {
        id,
        is_creature,
        name,
        parent_id,
      };
    })
  );
  const archetypesArr = asArray(dataMap.archetypes, []);
  const archetypes = removeUndefined(
    archetypesArr.map((item) => {
      const itemMap = asMap(item);
      if (itemMap === undefined) {
        return undefined;
      }
      const id = asNumber(itemMap.id, 0);
      const supertype = asNumber(itemMap.supertype, 0);
      const name = asString(itemMap.name, '');
      return {
        id,
        name,
        supertype,
      };
    })
  );
  const allcardsMap = asMap(dataMap.allcards);
  const allcards: [number, Card][] = [];
  if (allcardsMap !== undefined) {
    Object.keys(allcardsMap).forEach((elem) => {
      const cardElem = asMap(allcardsMap[elem]);
      if (cardElem !== undefined) {
        allcards.push([
          +elem,
          {
            id: asNumber(cardElem.id, 0),
            doublelink: asNumber(cardElem.doublelink, 0),
            cardid: asString(cardElem.cardid, ''),
            multiverseid: asNumber(cardElem.multiverseid, 0),
            name: asString(cardElem.name, ''),
            slug: asString(cardElem.slug, ''),
            kw: asString(cardElem.kw, ''),
            flavor: asString(cardElem.flavor, ''),
            power: asNumber(cardElem.power, 0),
            market: asNumber(cardElem.market, 0),
            toughness: asNumber(cardElem.toughness, 0),
            expansion: asNumber(cardElem.expansion, 0),
            rarity: asNumber(cardElem.rarity, 0),
            mana: asString(cardElem.mana, ''),
            convmana: asNumber(cardElem.convmana, 0),
            text: asString(cardElem.text, ''),
            loyalty: asNumber(cardElem.loyalty, 0),
            type: asNumber(cardElem.type, 0),
            subtype: asNumber(cardElem.subtype, 0),
            txttype: asString(cardElem.txttype, ''),
            pict: asString(cardElem.pict, ''),
            date_in: asNumber(cardElem.date_in, 0),
            colorindicator: asString(cardElem.colorindicator, ''),
            mtga_id: asNumber(cardElem.mtga_id, 0),
            is_collectible: asNumber(cardElem.is_collectible, 0),
            reprint: asNumber(cardElem.reprint, 0),
            draftrate: asNumber(cardElem.draftrate, 0),
            drafteval: asNumber(cardElem.drafteval, 0),
            is_land: asNumber(cardElem.is_land, 0),
            colorarr: asString(cardElem.colorarr, ''),
            currentstandard: asNumber(cardElem.currentstandard, 0),
            currenthistoric: asNumber(cardElem.currenthistoric, 0),
            art: asString(cardElem.art, ''),
            has_hiresimg: asNumber(cardElem.has_hiresimg, 0),
            willbeoutsoon: asNumber(cardElem.willbeoutsoon, 0),
            drafteval2: asNumber(cardElem.drafteval2, 0),
            wleval: asNumber(cardElem.wleval, 0),
            battleusage: asNumber(cardElem.battleusage, 0),
            wleval_draft: asNumber(cardElem.wleval_draft, 0),
            battleusage_draft: asNumber(cardElem.battleusage_draft, 0),
            is_boostable: asNumber(cardElem.is_boostable, 0),
            is_craftable: asNumber(cardElem.is_craftable, 0),
            TraditionalStandardBan: asNumber(cardElem.TraditionalStandardBan, 0),
            TraditionalHistoricBan: asNumber(cardElem.TraditionalHistoricBan, 0),
            StandardBan: asNumber(cardElem.StandardBan, 0),
            HistoricBan: asNumber(cardElem.HistoricBan, 0),
            wleval_1sthand: asNumber(cardElem.wleval_1sthand, 0),
          },
        ]);
      }
    });
  }
  const mtgatoinneridMap = asMap(dataMap.mtgatoinnerid);
  const mtgatoinnerid: {
    [index: number]: number;
  } = {};
  if (mtgatoinneridMap !== undefined) {
    Object.keys(mtgatoinneridMap).forEach((elem) => {
      mtgatoinnerid[+elem] = asNumber(mtgatoinneridMap[elem], 0);
    });
  }
  const trackerverMap = asMap(dataMap.trackerver);
  const trackerver: {
    version: number;
    date: number;
  } = {version: 0, date: 0};
  if (trackerverMap !== undefined) {
    trackerver.version = asNumber(trackerverMap.version, 0);
    trackerver.date = asNumber(trackerverMap.date, 0);
  }
  const expsorder = asArray<number>(dataMap.expsorder, []);
  const datefilters = asArray<number>(dataMap.datefilters, []);
  const datefilterlabels = asArray<string>(dataMap.datefilterlabels, []);
  const headerbanners = asArray<string>(dataMap.headerbanners, []);

  return {
    exps,
    expsorder,
    formats,
    datefilters,
    datefilterlabels,
    types,
    archetypes,
    allcards,
    mtgatoinnerid,
    trackerver,
    headerbanners,
  };
}
