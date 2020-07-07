import {app} from 'electron';

import {Request} from 'root/app/request';
import {asMap, asString} from 'root/lib/type_utils';
import {isMac} from 'root/lib/utils';

export async function errorReport(
  token?: string,
  file?: string,
  line?: number,
  col?: number,
  func?: string,
  errmsg?: string,
  errreport?: string
): Promise<boolean> {
  const res = await Request.gzip(`/mtg/donew2.php?cmd=cm_errreport&version=${app.getVersion()}${isMac() ? 'm' : 'w'}`, {
    token,
    file,
    line,
    col,
    func,
    errmsg,
    errreport,
  });
  const resMap = asMap(res);
  if (!resMap) {
    return false;
  }
  return asString(resMap.status, '').toUpperCase() === 'OK';
}
