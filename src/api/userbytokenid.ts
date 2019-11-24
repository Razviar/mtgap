import Request from 'root/lib/request';
import { UserResult, UserRequest } from 'root/models/userbytokenid';

export async function tokencheck(
  request: string,
  version: string
): Promise<{ uid: number; token: string; nick: string }> {
  const res = await Request.post<{ request: string }, { uid: number; token: string; nick: string }>(
    `/mtg/donew2.php?cmd=cm_tokencheck&version=${version}`,
    {
      request,
    }
  );
  return res;
}

export async function tokenrequest(mtgaid: string, version: string): Promise<{ [index: string]: string }> {
  const res = await Request.post<{ mtgaid: string }, { [index: string]: string }>(
    `/mtg/donew2.php?cmd=cm_tokenrequest&version=${version}`,
    {
      mtgaid,
    }
  );
  return res;
}

export async function userbytokenid(cmUserbyTokenid: string, version: string): Promise<UserResult> {
  const res = await Request.post<UserRequest, UserResult>(`/mtg/donew2.php?cmd=cm_userbytokenid&version=${version}`, {
    cm_userbytokenid: cmUserbyTokenid,
    version,
  });
  return res;
}

export async function setuserdata(mtgaId: string, mtgaNick: string, language: string, token: string, version: string) {
  const res = await Request.post<{ [index: string]: string }, UserResult>(
    `/mtg/donew2.php?cmd=cm_setuserdata&version=${version}`,
    {
      mtgaId,
      mtgaNick,
      language,
      token,
      // tslint:disable-next-line: no-magic-numbers
      usertime: ((-1 * new Date().getTimezoneOffset()) / 60).toString(),
    }
  );
  return res;
}
