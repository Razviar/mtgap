<<<<<<< HEAD
import {AxiosResponse, Request} from 'root/lib/request';
import {asMap, asString} from 'root/lib/type_utils';
import {UserRequest, UserResult} from 'root/models/userbytokenid';

//
// tokencheck
//

interface TokenCheckRes {
  uid: number;
  token: string;
  nick: string;
}

function parseTokenCheckRes(data: AxiosResponse): TokenCheckRes {
  // TODO - Safely parse this instead of casting
  return data as TokenCheckRes;
}

export async function tokencheck(request: string, version: string): Promise<TokenCheckRes> {
  return parseTokenCheckRes(
    await Request.post<{request: string}>(`mtg/donew2.php?cmd=cm_tokencheck&version=${version}`, {
=======
import Request from 'root/lib/request';
import { UserResult, UserRequest } from 'root/models/userbytokenid';

export async function tokencheck(
  request: string,
  version: string
): Promise<{ uid: number; token: string; nick: string }> {
  const res = await Request.post<{ request: string }, { uid: number; token: string; nick: string }>(
    `mtg/donew2.php?cmd=cm_tokencheck&version=${version}`,
    {
>>>>>>> f50c09694b48994ce41d459833507ce3daa89ed2
      request,
    })
  );
}

<<<<<<< HEAD
//
// tokenrequest
//

interface TokenRequestRes {
  [index: string]: string;
}

function parseTokenRequestRes(data: AxiosResponse): TokenRequestRes {
  // TODO - Safely parse this instead of casting
  return data as TokenRequestRes;
}

export async function tokenrequest(mtgaid: string, version: string): Promise<TokenRequestRes> {
  return parseTokenRequestRes(
    await Request.post<{mtgaid: string}>(`mtg/donew2.php?cmd=cm_tokenrequest&version=${version}`, {
=======
export async function tokenrequest(mtgaid: string, version: string): Promise<{ [index: string]: string }> {
  const res = await Request.post<{ mtgaid: string }, { [index: string]: string }>(
    `mtg/donew2.php?cmd=cm_tokenrequest&version=${version}`,
    {
>>>>>>> f50c09694b48994ce41d459833507ce3daa89ed2
      mtgaid,
    })
  );
}

//
// userbytokenid
//

function parseUserResult(data: AxiosResponse): UserResult {
  const dataMap = asMap(data);
  if (dataMap === undefined) {
    throw new Error(`Invalid UserResult, response is not an object (got ${typeof data})`);
  }

  const status = asString(dataMap.status);
  const dataString = asString(dataMap.data);

  if (status === undefined) {
    throw new Error(`Invalid UserResult, status is attribute is not a string (got ${dataMap.status})`);
  }
  if (dataString === undefined) {
    throw new Error(`Invalid UserResult, dataString is attribute is not a string (got ${dataMap.dataString})`);
  }

  return {status, data: dataString};
}

export async function userbytokenid(cmUserbyTokenid: string, version: string): Promise<UserResult> {
<<<<<<< HEAD
  return parseUserResult(
    await Request.post<UserRequest>(`mtg/donew2.php?cmd=cm_userbytokenid&version=${version}`, {
      cm_userbytokenid: cmUserbyTokenid,
      version,
    })
  );
}

//
// setuserdata
//

export interface UserData {
  mtgaId: string;
  mtgaNick: string;
  language: string;
  token: string;
}

export async function setuserdata(userData: UserData, version: string): Promise<UserResult> {
  const usertime = ((-1 * new Date().getTimezoneOffset()) / 60).toString();
  return parseUserResult(
    await Request.post<UserData & {usertime: string}>(`mtg/donew2.php?cmd=cm_setuserdata&version=${version}`, {
      ...userData,
      usertime,
    })
=======
  const res = await Request.post<UserRequest, UserResult>(`mtg/donew2.php?cmd=cm_userbytokenid&version=${version}`, {
    cm_userbytokenid: cmUserbyTokenid,
    version,
  });
  return res;
}

export async function setuserdata(mtgaId: string, mtgaNick: string, language: string, token: string, version: string) {
  const res = await Request.post<{ [index: string]: string }, UserResult>(
    `mtg/donew2.php?cmd=cm_setuserdata&version=${version}`,
    {
      mtgaId,
      mtgaNick,
      language,
      token,
      // tslint:disable-next-line: no-magic-numbers
      usertime: ((-1 * new Date().getTimezoneOffset()) / 60).toString(),
    }
>>>>>>> f50c09694b48994ce41d459833507ce3daa89ed2
  );
}
