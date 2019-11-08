import Request from 'root/lib/request';
import { UserResult, UserRequest } from 'root/models/userbytokenid';

export async function userbytokenid(
  cmUserbyTokenid: string,
  version: number
): Promise<UserResult> {
  const res = await Request.post<UserRequest, UserResult>(
    '/mtg/donew2.php?cmd=cm_userbytokenid',
    {
      cm_userbytokenid: cmUserbyTokenid,
      version,
    }
  );
  return res;
}
