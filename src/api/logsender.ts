import Request from 'root/lib/request';
import { ParseResults } from 'root/models/indicators';

interface LogRequest {
  results: ParseResults[];
  token: string;
}

export async function uploadpackfile(
  results: ParseResults[],
  token: string
): Promise<{ [index: string]: string }> {
  console.log(results);
  console.log(token);
  const res = await Request.gzip<LogRequest, { [index: string]: string }>(
    '/mtg/donew2.php?cmd=cm_uploadpackfile',
    {
      results,
      token,
    }
  );
  return res;
}
