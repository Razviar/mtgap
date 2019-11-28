import {Request} from 'root/app/request';
import {asMap, asString} from 'root/lib/type_utils';
import {ParseResults} from 'root/models/indicators';

export async function uploadpackfile(results: ParseResults[], version: string): Promise<boolean> {
  const res = await Request.gzip<ParseResults[]>(`mtg/donew2.php?cmd=cm_uploadpackfile&version=${version}`, results);
  const resMap = asMap(res);
  if (resMap === undefined) {
    return false;
  }
  return asString(resMap.status, '').toUpperCase() === 'OK';
}
