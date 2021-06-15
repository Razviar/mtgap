import {app} from 'electron';

import {parseMetadata} from 'root/api/parseMetadata';
import {parseUserMetadata} from 'root/api/parseUserMetadata';
import {AxiosResponse, Request} from 'root/app/request';
import {error} from 'root/lib/logger';
import {asArray, asMap, asNumber, asString, removeUndefined} from 'root/lib/type_utils';
import {isMac} from 'root/lib/utils';
import {LiveMatch, LiveMatchRequest} from 'root/models/match';
import {Metadata, UserMetadata} from 'root/models/metadata';

function parseLiveMatch(data: AxiosResponse): LiveMatch {
  const dataMap = asMap(data);
  if (dataMap === undefined) {
    error('Error while parsing a LiveMatch: not an object', undefined, {data});
    return {deckstruct: [], humanname: ''};
  }
  const humanname = asString(dataMap.humanname, '');
  const deckstructArr = asArray(dataMap.deckstruct, []);
  const deckstruct = removeUndefined(
    deckstructArr.map((item) => {
      const itemMap = asMap(item);
      if (itemMap === undefined) {
        error('Error while parsing a deckstruct of a LiveMatch: value is not an object', undefined, {item});
        return undefined;
      }
      const card = asNumber(itemMap.card);
      const cardnum = asNumber(itemMap.cardnum);
      if (card === undefined || cardnum === undefined) {
        error('Error while parsing a deckstruct of a LiveMatch: card or cardnum is not a number', undefined, {item});
        return undefined;
      }
      return {card, cardnum};
    })
  );
  return {humanname, deckstruct};
}

export async function getlivematch(matchid: string, uid: string): Promise<LiveMatch> {
  return parseLiveMatch(
    await Request.post<LiveMatchRequest>(
      `/mtg/donew2.php?cmd=cm_getlivematch&version=${app.getVersion()}${isMac() ? 'm' : 'w'}`,
      {
        matchid,
        uid,
      }
    )
  );
}

export async function getUserMetadata(uid: number): Promise<UserMetadata> {
  return parseUserMetadata(
    await Request.get(`/mtg/donew2.php?cmd=getuserdata&version=${app.getVersion()}${isMac() ? 'm' : 'w'}&uid=${uid}`)
  );
}

export async function getMetadata(): Promise<Metadata> {
  return parseMetadata(
    await Request.get(
      `/mtg/donew2.php?cmd=getmetadata&version=${app.getVersion()}${isMac() ? 'm' : 'w'}`,
      {},
      'https://static2.mtgarena.pro/'
    )
  );
}
