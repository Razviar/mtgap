import {app} from 'electron';

import {ParsingMetadata} from 'root/app/log-parser/model';
import {AxiosResponse, Request} from 'root/app/request';
import {error} from 'root/lib/logger';
import {asArray, asMap, asNumber, asString, asStringMap, removeUndefined} from 'root/lib/type_utils';
import {Indicators} from 'root/models/indicators';

function parseIndicators(data: AxiosResponse): Indicators[] {
  const dataArr = asArray(data);
  if (dataArr === undefined) {
    error('Error while parsing array of Indicators: not an array', undefined, {
      data,
    });
    return [];
  }
  const parsedIndicators = dataArr.map(item => {
    const itemMap = asMap(item);
    if (itemMap === undefined) {
      error('Error while parsing an Indicators: value is not an object', undefined, {item});
      return undefined;
    }
    const marker = asNumber(itemMap.marker);
    if (marker === undefined) {
      error('Error while parsing an Indicators: marker is not a valid number', undefined, {marker: itemMap.marker});
      return undefined;
    }

    const theIndicators = asString(itemMap.Indicators, '');
    const Send = asString(itemMap.Send, '');
    const Needrunning = asString(itemMap.Needrunning, '');
    const Addup = asString(itemMap.Addup, '');
    const Stopper = asString(itemMap.Stopper, '');
    const Needtohave = asString(itemMap.Needtohave, '');
    const Ignore = asString(itemMap.Ignore, '');
    return {
      marker,
      Indicators: theIndicators,
      Send,
      Needrunning,
      Addup,
      Stopper,
      Needtohave,
      Ignore,
    };
  });
  return removeUndefined(parsedIndicators);
}

function parseDates(data: AxiosResponse): Map<string, string> {
  const stringMap = asStringMap(data);
  if (stringMap === undefined) {
    error('Error while parsing a map of dates, not an object', undefined, {
      data,
    });
    return new Map<string, string>();
  }
  return stringMap;
}

export async function getindicators(): Promise<{
  indicators: Indicators[];
  dates: Map<string, string>;
}> {
  const indicators = parseIndicators(
    await Request.get(`mtg/donew2.php?cmd=cm_getindicators&version=${app.getVersion()}`)
  );
  const dates = parseDates(await Request.get(`mtg/donew2.php?cmd=cm_getdateformats&version=${app.getVersion()}`));
  return {indicators, dates};
}

export async function getParsingMetadata(version: string): Promise<ParsingMetadata> {
  return Request.get(`mtg/json/parsing_metadata_${version}.json`);
}
