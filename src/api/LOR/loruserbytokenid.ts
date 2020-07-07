import {app} from 'electron';

import {AxiosResponse, Request} from 'root/app/request';
import {isMac} from 'root/lib/utils';

//
// tokencheck
//

export interface TokenCheckRes {
  uid: string;
  token: string;
  nick: string;
}

function parseTokenCheckRes(data: AxiosResponse): TokenCheckRes | undefined {
  // TODO - Safely parse this instead of casting
  try {
    return data as TokenCheckRes;
  } catch (_) {
    return undefined;
  }
}

export async function LORtokencheck(request: string): Promise<TokenCheckRes | undefined> {
  return parseTokenCheckRes(
    await Request.post<{request: string}>(
      `/lor/donew2.php?cmd=cm_tokencheck&version=${app.getVersion()}${isMac() ? 'm' : 'w'}`,
      {
        request,
      }
    )
  );
}

//
// tokenrequest
//

export interface LorTokenRequestRes {
  [index: string]: string;
}

function parseTokenRequestRes(data: AxiosResponse): LorTokenRequestRes {
  // TODO - Safely parse this instead of casting
  return data as LorTokenRequestRes;
}

export async function lortokenrequest(): Promise<LorTokenRequestRes> {
  return parseTokenRequestRes(
    await Request.post(`/lor/donew2.php?cmd=cm_tokenrequest&version=${app.getVersion()}${isMac() ? 'm' : 'w'}`, {})
  );
}
