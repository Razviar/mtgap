import {Request} from 'root/lib/request';
import {asMap, asString} from 'root/lib/type_utils';
import {ParseResults} from 'root/models/indicators';

export async function uploadpackfile(results: ParseResults[], version: string): Promise<boolean> {
<<<<<<< HEAD
  const res = await Request.gzip<ParseResults[]>(`mtg/donew2.php?cmd=cm_uploadpackfile&version=${version}`, results);
  const resMap = asMap(res);
  if (resMap === undefined) {
    return false;
  }
  return asString(resMap.status, '').toUpperCase() === 'OK';
=======
  /*console.log('SENDER! ' + results.length);
  console.log(results);*/
  //console.log(token);
  const res = await Request.gzip<ParseResults[], { [index: string]: string }>(
    `mtg/donew2.php?cmd=cm_uploadpackfile&version=${version}`,
    results
  );
  //console.log(res.status);
  if (res && res.status && res.status === 'ok') {
    return true;
  } else {
    return false;
  }
>>>>>>> f50c09694b48994ce41d459833507ce3daa89ed2
}
