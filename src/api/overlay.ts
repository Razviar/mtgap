import Request from 'root/lib/request';

interface LiveMatchRequest {
  matchid: string;
  token: string;
}

interface LiveMatch {
  deckstruct: { [index: number]: number };
  humanname: string;
}

export async function getlivematch(matchid: string, token: string, version: string): Promise<LiveMatch> {
  const res = await Request.post<LiveMatchRequest, LiveMatch>(`/mtg/donew2.php?cmd=cm_tokencheck&version=${version}`, {
    matchid,
    token,
  });
  return res;
}
