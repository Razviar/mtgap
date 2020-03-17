import {LorParser} from 'root/app/lor-tracking/lor_parser';
import {error} from 'root/lib/logger';

export type MaybeLorParser = LorParser | undefined;
let lorParser: MaybeLorParser;

export function getLorParser(): LorParser | undefined {
  return lorParser;
}

export function withLogParser(fn: (lorParser: LorParser) => void): void {
  if (lorParser === undefined) {
    return;
  }
  fn(lorParser);
}

export function createGlobalLorParser(): LorParser {
  lorParser = new LorParser();

  lorParser.start().catch(err => {
    error('Failure to start parser', err);
  });

  return lorParser;
}
