import electron from 'electron';
import path from 'path';
import fs from 'fs';
import readline from 'readline';
import chokidar from 'chokidar';
import { Indicators, ParseResults } from 'root/models/indicators';
import { getindicators } from 'root/api/getindicators';
import { substrcount } from './func';

export class Dispatcher {
  public sendlog(results: ParseResults[], uid: number, token: string) {}
}
