import Request from 'root/lib/request';
import { ParseResults } from 'root/models/indicators';

export async function uploadpackfile(results: ParseResults[], version: string): Promise<boolean> {
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
}
