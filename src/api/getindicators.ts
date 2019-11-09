import Request from 'root/lib/request';
import { Indicators } from 'root/models/indicators';

export async function getindicators(): Promise<Indicators[]> {
  const res = await Request.get<Indicators[]>(
    '/mtg/donew2.php?cmd=cm_getindicators'
  );
  return res;
}
