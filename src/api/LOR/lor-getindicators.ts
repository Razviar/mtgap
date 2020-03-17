import {LorParsingMetadata} from 'root/app/lor-tracking/model';
import {Request} from 'root/app/request';

export async function getLORParsingMetadata(version: string): Promise<LorParsingMetadata> {
  const res = await Request.get(`lor/json/parsing_metadata_${version}.json`);
  if (typeof res === 'string') {
    throw new Error('Cannot parse remote metadata');
  }
  return res as LorParsingMetadata;
}
