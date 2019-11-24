import Request from 'root/lib/request';
import { Indicators } from 'root/models/indicators';

export async function getindicators(
  version: string
): Promise<{
  indicators: Indicators[];
  dates: { [index: string]: string };
}> {
  //console.log('??');
  const indicators = await Request.get<Indicators[]>(`/mtg/donew2.php?cmd=cm_getindicators&version=${version}`);
  const dates = await Request.get<{ [index: string]: string }>(
    `/mtg/donew2.php?cmd=cm_getdateformats&version=${version}`
  );
  return { indicators, dates };
}
