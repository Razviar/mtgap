import electron from 'electron';
import path from 'path';
import fs from 'fs';
import readline from 'readline';
import chokidar from 'chokidar';
import { Indicators, ParseResults } from 'root/models/indicators';
import { getindicators } from 'root/api/getindicators';
import { substrcount } from './func';
import Emittery from 'emittery';

export class LogParser {
  private path: string;
  private indicators: Indicators[];
  private loglen: number = 0;
  private linesread: number = 0;
  private strdate: number = 0;
  private strdateUnparsed: string = '';
  private dateregexp: RegExp = /[\d]{1,2}[:./ ]{1,2}[\d]{1,2}/gm;
  private nowWriting: number = 0;
  private results: ParseResults[] = [];
  public emitter = new Emittery();

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
      if (fs.existsSync(this.path)) {
        chokidar
          .watch(this.path, { usePolling: true, interval: 500 })
          .on('change', (p, s) => {
            this.checkLog(p, s);
          });

        this.checkLog(this.path, fs.statSync(this.path));
      } else {
        this.emitter.emit('error', 'No log file found');
      }
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
        this.strdateUnparsed = line;
      }

      this.indicators.forEach(indicator => {
        if (line.includes(indicator.Indicators) && indicator.Send) {
          this.nowWriting = indicator.marker;
          this.strdate = this.parseDate(this.strdateUnparsed);
          if (indicator.Ignore !== 'a') {
            foundIndicator = true;
            brackets = this.bracketeer(
              line.replace('[UnityCrossThreadLogger]', ''),
              brackets
            );
          } else {
            this.results.push({
              time: this.strdate,
              indicator: indicator.marker,
              json: this.writingSingleLine(line, indicator.Indicators),
            });
          }
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
      this.emitter.emit('newdata', this.results);
      //console.log(this.results);
      this.results = [];
    });
  }

  private parseDate(line: string) {
    const cutter = line.indexOf(': ');
    const shift = '[UnityCrossThreadLogger]'.length;
    return Date.parse(
      line
        .replace('[UnityCrossThreadLogger]', '')
        .substring(0, cutter !== -1 ? cutter - shift : undefined)
    );
  }

  private bracketeer(
    line: string,
    brackets: { curly: number; squared: number }
  ) {
    brackets.curly =
      brackets.curly + substrcount(line, '{') - substrcount(line, '}');

    brackets.squared =
      brackets.squared + substrcount(line, '[') - substrcount(line, ']');

    return brackets;
  }

  private writing(line: string, brackets: { curly: number; squared: number }) {
    const append = this.results.findIndex(
      elem =>
        +elem.indicator === +this.nowWriting && +elem.time === +this.strdate
    );
    if (append !== -1) {
      this.results[append].json += line;
    } else {
      this.results.push({
        time: this.strdate,
        indicator: this.nowWriting,
        json: line,
      });
    }

    return this.bracketeer(line, brackets);
  }

  private writingSingleLine(line: string, indicator: string) {
    //console.log(indicator);
    const workingline = line.substring(
      line.indexOf(indicator) + indicator.length
    );
    const brackets = { curly: 0, squared: 0 };
    let result = '';
    let i = 0;

    while (
      brackets.curly === 0 &&
      brackets.squared === 0 &&
      i < workingline.length
    ) {
      const char = workingline.charAt(i);
      switch (char) {
        case '{':
          brackets.curly++;
          result += char;
          break;
        case '[':
          brackets.squared++;
          result += char;
          break;
      }
      i++;
    }

    while (
      (brackets.curly > 0 || brackets.squared > 0) &&
      i < workingline.length
    ) {
      const char = workingline.charAt(i);
      result += char;
      switch (char) {
        case '{':
          brackets.curly++;
          break;
        case '[':
          brackets.squared++;
          break;
        case '}':
          brackets.curly--;
          break;
        case ']':
          brackets.squared--;
          break;
      }
      i++;
    }

    return result;
  }
}
