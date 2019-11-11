import electron from 'electron';
import path from 'path';
import fs from 'fs';
import readline from 'readline';
import chokidar from 'chokidar';
import { Indicators, ParseResults } from 'root/models/indicators';
import { getindicators } from 'root/api/getindicators';
import { substrcount } from './func';

export class Match {
  private matchId: string;
  constructor(id: string) {
    this.matchId = id;
  }

  public over() {}

  public mycard() {}
}
