import {app} from 'electron';

import {Request} from 'root/app/request';
import {asMap, asString} from 'root/lib/type_utils';

export async function pingMtga(): Promise<boolean> {
  const res = await Request.get(`/mtg/donew2.php?cmd=cm_checkconn&version=${app.getVersion()}`);
  const resMap = asMap(res);
  if (!resMap) {
    return false;
  }
  return asString(resMap.status, '').toUpperCase() === 'OK';
}
