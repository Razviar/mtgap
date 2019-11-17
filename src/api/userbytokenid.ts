import Request from 'root/lib/request';
import { UserResult, UserRequest } from 'root/models/userbytokenid';

export async function userbytokenid(cmUserbyTokenid: string, version: number): Promise<UserResult> {
  const res = await Request.post<UserRequest, UserResult>('/mtg/donew2.php?cmd=cm_userbytokenid', {
    cm_userbytokenid: cmUserbyTokenid,
    version,
  });
  return res;
}

export async function setuserdata(mtgaId: string, mtgaNick: string, language: string, token: string) {
  const res = await Request.post<{ [index: string]: string }, UserResult>('/mtg/donew2.php?cmd=cm_setuserdata', {
    mtgaId,
    mtgaNick,
    language,
    token,
    // tslint:disable-next-line: no-magic-numbers
    usertime: ((-1 * new Date().getTimezoneOffset()) / 60).toString(),
  });
  return res;
}
