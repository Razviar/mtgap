import {Request} from 'root/app/request';
import {asString} from 'root/lib/type_utils';

export async function checkFileBeforeUpload(checkmd5: string): Promise<boolean> {
  const res = await Request.gzip('/mtg/uploadcards.php?version=1', {checkmd5});
  //console.log(checkmd5);
  //console.log(res);
  const resMap = asString(res);
  return resMap === 'UPDATE';
  //return true;
}
