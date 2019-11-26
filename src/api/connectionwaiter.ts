import {Request} from 'root/lib/request';
import {asMap, asString} from 'root/lib/type_utils';

export async function pingMtga(version: string): Promise<boolean> {
  const res = await Request.get(`/mtg/donew2.php?cmd=cm_checkconn&version=${version}`);
  const resMap = asMap(res);
  if (!resMap) {
    return false;
  }
  return asString(resMap.status) === 'OK';
}
