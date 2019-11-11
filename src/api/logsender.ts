import Request from 'root/lib/request';
import { ParseResults } from 'root/models/indicators';

interface LogRequest {
  results: ParseResults[];
  uid: number;
  token: string;
}

export async function uploadpackfile(
  results: ParseResults[],
  uid: number,
  token: string
): Promise<{ [index: string]: string }> {
  const res = await Request.gzip<LogRequest, { [index: string]: string }>(
    '/mtg/donew2.php?cmd=cm_uploadpackfile',
    {
      results,
      uid,
      token,
    }
  );
  return res;
}
