import electron from 'electron';
import path from 'path';
import fs from 'fs';
import readline from 'readline';
import chokidar from 'chokidar';
import { Indicators } from 'root/models/indicators';
import { getindicators } from 'root/api/getindicators';
import { substrcount } from './func';

export class LogParser {
  private path: string;
  private indicators: Indicators[];
  private loglen: number = 0;
  private linesread: number = 0;
  private strdate: number = 0;
  private dateregexp: RegExp = /[\d]{1,2}[:./ ]{1,2}[\d]{1,2}/gm;
  private nowWriting: number = 0;
  private results: { [index: number]: { [index: number]: string } } = {};

  constructor(targetname: string[]) {
    const appDataPath = (electron.app || electron.remote.app).getPath(
      'appData'
    );
    this.path = path.join(appDataPath, ...targetname).replace('Roaming\\', '');
    this.indicators = [];
  }

  public start() {
    getindicators().then(i => {
      this.indicators = i;
      //console.log(this.indicators);
      chokidar
        .watch(this.path, { usePolling: true, interval: 500 })
        .on('change', (p, s) => {
          this.checkLog(p, s);
        });
    });
  }

  public checkLog(pth: string, stats: fs.Stats | undefined) {
    let brackets = { curly: 0, squared: 0 };

    let newloglen = 0;
    this.linesread = 0;
    if (stats) {
      newloglen = stats.size;
      if (newloglen < this.loglen) {
        this.loglen = 0;
      }
    } else {
      this.loglen = 0;
    }

    //console.log('Size:' + this.loglen);

    const Stream = fs.createReadStream(pth, {
      encoding: 'utf8',
      autoClose: true,
      start: this.loglen,
    });

    const rl = readline.createInterface({
      input: Stream,
    });

    rl.on('line', line => {
      this.linesread++;
      let foundIndicator = false;

      if (
        line.includes('[UnityCrossThreadLogger]') &&
        line.match(this.dateregexp)
      ) {
        const cutter = line.indexOf(': ');
        const shift = '[UnityCrossThreadLogger]'.length;
        this.strdate = Date.parse(
          line
            .replace('[UnityCrossThreadLogger]', '')
            .substring(0, cutter !== -1 ? cutter - shift : undefined)
        );
      }

      this.indicators.forEach(indicator => {
        if (line.includes(indicator.Indicators)) {
          this.nowWriting = indicator.marker;
          foundIndicator = true && indicator.Ignore !== 'a';
        }
      });

      if (foundIndicator) {
        return;
      }

      if (this.nowWriting !== 0) {
        brackets = this.writing(line, brackets);
      }

      if (brackets.curly === 0 && brackets.squared === 0) {
        this.nowWriting = 0;
      }
    });

    rl.on('close', () => {
      this.loglen = newloglen;
      console.log(this.results);
      this.results = {};
    });
  }

  private writing(line: string, brackets: { curly: number; squared: number }) {
    brackets.curly =
      brackets.curly + substrcount(line, '{') - substrcount(line, '}');

    brackets.squared =
      brackets.squared + substrcount(line, '[') - substrcount(line, ']');

    if (!this.results[this.strdate]) {
      this.results[this.strdate] = {};
    }
    if (!this.results[this.strdate][this.nowWriting]) {
      this.results[this.strdate][this.nowWriting] = '';
    }

    this.results[this.strdate][this.nowWriting] += line;

    return brackets;
  }
}
