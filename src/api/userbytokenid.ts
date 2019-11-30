import {app} from 'electron';

import {AxiosResponse, Request} from 'root/app/request';
import {asMap, asString} from 'root/lib/type_utils';
import {UserRequest, UserResult} from 'root/models/userbytokenid';

//
// tokencheck
//

export interface TokenCheckRes {
  uid: string;
  token: string;
  nick: string;
}

function parseTokenCheckRes(data: AxiosResponse): TokenCheckRes {
  // TODO - Safely parse this instead of casting
  return data as TokenCheckRes;
}

export async function tokencheck(request: string): Promise<TokenCheckRes> {
  return parseTokenCheckRes(
    await Request.post<{request: string}>(`mtg/donew2.php?cmd=cm_tokencheck&version=${app.getVersion()}`, {
      request,
    })
  );
}

//
// tokenrequest
//

export interface TokenRequestRes {
  [index: string]: string;
}

function parseTokenRequestRes(data: AxiosResponse): TokenRequestRes {
  // TODO - Safely parse this instead of casting
  return data as TokenRequestRes;
}

export async function tokenrequest(mtgaid: string): Promise<TokenRequestRes> {
  return parseTokenRequestRes(
    await Request.post<{mtgaid: string}>(`mtg/donew2.php?cmd=cm_tokenrequest&version=${app.getVersion()}`, {
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

export async function userbytokenid(cmUserbyTokenid: string): Promise<UserResult> {
  return parseUserResult(
    await Request.post<UserRequest>(`mtg/donew2.php?cmd=cm_userbytokenid&version=${app.getVersion()}`, {
      cm_userbytokenid: cmUserbyTokenid,
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

export async function setuserdata(userData: UserData): Promise<UserResult> {
  const usertime = ((-1 * new Date().getTimezoneOffset()) / 60).toString();
  return parseUserResult(
    await Request.post<UserData & {usertime: string}>(`mtg/donew2.php?cmd=cm_setuserdata&version=${app.getVersion()}`, {
      ...userData,
      usertime,
    })
  );
}
