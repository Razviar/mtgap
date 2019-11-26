import Request from 'root/lib/request';
import { LiveMatch, LiveMatchRequest } from 'root/models/match';
import { Metadata, UserMetadata } from 'root/models/metadata';

export async function getlivematch(matchid: string, uid: number, version: string): Promise<LiveMatch> {
  const res = await Request.post<LiveMatchRequest, LiveMatch>(`mtg/donew2.php?cmd=cm_getlivematch&version=${version}`, {
    matchid,
    uid,
  });
  return res;
}

export async function getUserMetadata(uid: number, version: string): Promise<UserMetadata> {
  const res = await Request.get<UserMetadata>(`mtg/donew2.php?cmd=getuserdata&version=${version}&uid=${uid}`);
  return res;
}

export async function getMetadata(version: string): Promise<Metadata> {
  const res = await Request.get<Metadata>(`mtg/donew2.php?cmd=getmetadata&version=${version}`);
  return res;
}
