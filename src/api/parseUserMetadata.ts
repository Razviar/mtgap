import {AxiosResponse} from 'root/app/request';
import {error} from 'root/lib/logger';
import {asArray, asBoolean, asMap, asNumber, asString, removeUndefined} from 'root/lib/type_utils';
import {UserMetadata} from 'root/models/metadata';

export function parseUserMetadata(data: AxiosResponse): UserMetadata {
  const user = {user_id: 0, lang: 'EN', cardimagestype: 0, pledge: 0};
  const collection: {
    [index: number]: {
      ic: number;
      ir: number;
      it: number;
    };
  } = {};
  const usercapabilities: {
    [index: string]: boolean;
  } = {};
  const coursedecks: {
    [index: string]: {
      udeck: string;
      humanname: string;
      deckstruct: {
        card: number;
        cardnum: number;
      }[];
    };
  } = {};
  const dataMap = asMap(data);
  if (dataMap === undefined) {
    error('Error while parsing a LiveMatch: not an object', undefined, {data});
    return {user, collection, usercapabilities, coursedecks};
  }
  const userMap = asMap(dataMap.user);
  if (userMap !== undefined) {
    user.user_id = asNumber(userMap.user_id, 0);
    user.lang = asString(userMap.lang, '');
    user.cardimagestype = asNumber(userMap.cardimagestype, 0);
    user.pledge = asNumber(userMap.pledge, 0);
  }
  const collectionMap = asMap(dataMap.collection);
  if (collectionMap !== undefined) {
    Object.keys(collectionMap).forEach((elem) => {
      const cardElem = asMap(collectionMap[elem]);
      if (cardElem !== undefined) {
        collection[+elem] = {ic: asNumber(cardElem.ic, 0), ir: asNumber(cardElem.ir, 0), it: asNumber(cardElem.it, 0)};
      }
    });
  }
  const usercapabilitiesMap = asMap(dataMap.usercapabilities);
  if (usercapabilitiesMap !== undefined) {
    Object.keys(usercapabilitiesMap).forEach((elem) => {
      usercapabilities[elem] = asBoolean(usercapabilitiesMap[elem], false);
    });
  }
  const coursedecksMap = asMap(dataMap.coursedecks);
  if (coursedecksMap !== undefined) {
    Object.keys(coursedecksMap).forEach((elem) => {
      const CourseElem = asMap(coursedecksMap[elem]);
      if (CourseElem !== undefined) {
        const udeck = asString(CourseElem.udeck, '');
        const humanname = asString(CourseElem.humanname, '');
        const deckstructArr = asArray(CourseElem.deckstruct);
        let deckstruct: {
          card: number;
          cardnum: number;
        }[] = [];
        if (deckstructArr !== undefined) {
          deckstruct = removeUndefined(
            deckstructArr.map((item) => {
              const itemMap = asMap(item);
              if (itemMap === undefined) {
                return {card: 0, cardnum: 0};
              }
              return {
                card: asNumber(itemMap.card, 0),
                cardnum: asNumber(itemMap.cardnum, 0),
              };
            })
          );
        }
        coursedecks[elem] = {udeck, humanname, deckstruct};
      }
    });
  }
  return {user, collection, usercapabilities, coursedecks};
}
