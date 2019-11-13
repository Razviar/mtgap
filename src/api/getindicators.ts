import Request from 'root/lib/request';
import { Indicators } from 'root/models/indicators';

export async function getindicators(): Promise<{
  indicators: Indicators[];
  dates: { [index: string]: string };
}> {
  const indicators = await Request.get<Indicators[]>(
    '/mtg/donew2.php?cmd=cm_getindicators'
  );
  const dates = await Request.get<{ [index: string]: string }>(
    '/mtg/donew2.php?cmd=cm_getdateformats'
  );
  return { indicators, dates };
}
