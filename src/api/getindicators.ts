import {ParsingMetadata} from 'root/app/log-parser/model';
import {Request} from 'root/app/request';

export async function getParsingMetadata(version: string): Promise<ParsingMetadata> {
  const res = await Request.get(`/mtg/json/parsing_metadata_${version}.json`);
  if (typeof res === 'string') {
    throw new Error('Cannot parse remote metadata');
  }
  return res as ParsingMetadata;
}
