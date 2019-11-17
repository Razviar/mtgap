import electron from 'electron';
import path from 'path';
import fs from 'fs';
import readline from 'readline';
import chokidar from 'chokidar';
import { Indicators, ParseResults } from 'root/models/indicators';
import { getindicators } from 'root/api/getindicators';
import { substrcount, Cut, findLastIndex } from './func';
import Emittery from 'emittery';
import { format, parse } from 'date-fns';

export class LogParser {
  private path: string;
  private indicators: Indicators[] = [];
  private dateformats: { [index: string]: string } = {};
  private userlang = 'English';
  private loglen: number = 0;
  private skiplines: number = 0;
  private strdate: number = 0;
  private strdateUnparsed: string = '';
  private dateregexp: RegExp = /[\d]{1,2}[:./ ]{1,2}[\d]{1,2}/gm;
  private nowWriting: number = 0;
  private results: ParseResults[] = [];
  private logsdisabled: boolean = false;
  private userswitched: boolean = false;
  private newmatch: boolean = false;
  private firstread: boolean = true;
  private watcher: chokidar.FSWatcher;
  private newPlayerData: {
    playerId: string;
    screenName: string;
    language: string;
  } = { playerId: '', screenName: '', language: '' };
  private currentMatchId: string = '';
  private doppler: { [index: number]: number } = {};

  public emitter = new Emittery();

  constructor(targetname: string[]) {
    const appDataPath = (electron.app || electron.remote.app).getPath(
      'appData'
    );
    this.path = path.join(appDataPath, ...targetname).replace('Roaming\\', '');
    this.watcher = chokidar.watch(this.path, {
      usePolling: true,
      interval: 500,
    });
  }

  public start() {
    getindicators().then(i => {
      this.indicators = i.indicators;
      this.dateformats = i.dates;
      //console.log(this.indicators);
      this.watcher.on('change', (p, s) => {
        this.checkLog(p, s, 'start');
      });

      if (!fs.existsSync(this.path)) {
        this.emitter.emit('error', 'No log file found');
      } else {
        this.checkLog(this.path, fs.statSync(this.path), 'watcher');
      }
    });
  }

  public stop() {
    this.logsdisabled = false;
    this.watcher.close();
  }

  public setPlayerId(plid: string, pname: string) {
    if (
      this.newPlayerData.playerId === plid &&
      this.newPlayerData.screenName === pname
    ) {
      this.userswitched = false;
      this.checkLog(this.path, fs.statSync(this.path), 'setPlayerId');
    }
  }

  public checkLog(pth: string, stats: fs.Stats | undefined, source?: string) {
    //(this.skiplines);
    const LoginIndicator = 21;
    let brackets = { curly: 0, squared: 0 };
    let skip = this.skiplines;
    let linesread = 0;

    let newloglen = 0;
    if (stats) {
      newloglen = stats.size;
      if (newloglen < this.loglen) {
        this.loglen = 0;
        this.skiplines = 0;
      }
    } else {
      this.loglen = 0;
      this.skiplines = 0;
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
      let foundIndicator = false;

      if (skip > 0) {
        skip--;
        return;
      }

      if (
        line.includes('[UnityCrossThreadLogger]') &&
        line.match(this.dateregexp)
      ) {
        this.strdateUnparsed = line;
      }

      if (line.includes('DETAILED LOGS: DISABLED')) {
        this.logsdisabled = true;
        this.skiplines = linesread;
        this.emitter.emit('error', 'Enable Detailed Logs!');
      }

      if (line.includes('DETAILED LOGS: ENABLED')) {
        this.logsdisabled = false;
      }

      //, 'matchId'

      if (line.includes('"language": ') && !line.includes('null')) {
        const param = Cut(line, '"language": "', '"');
        this.userlang = param;
        if (!this.logsdisabled) {
          this.emitter.emit('language', param);
        }
      }
      linesread++;
      if (this.logsdisabled || this.userswitched || this.newmatch) {
        return;
      }

      this.skiplines = 0;

      this.indicators.forEach(indicator => {
        if (line.includes(indicator.Indicators)) {
          this.strdate = this.parseDate(this.strdateUnparsed);
          if (!this.doppler[this.strdate]) {
            this.doppler[this.strdate] = 0;
          }
          if (indicator.Ignore !== 'a') {
            this.nowWriting = +indicator.marker;
            foundIndicator = true;
            brackets = this.bracketeer(
              line.replace('[UnityCrossThreadLogger]', ''),
              brackets
            );
            let pusher = '';
            if (line.includes('{')) {
              pusher = '{';
            }
            if (line.includes('[')) {
              pusher = '[';
            }

            if (pusher !== '') {
              this.results.push({
                time: this.strdate + this.doppler[this.strdate],
                indicator: +indicator.marker,
                json: pusher,
                uid: this.newPlayerData.playerId,
                matchId: this.currentMatchId,
              });
            }
          } else {
            this.results.push({
              time: this.strdate + this.doppler[this.strdate],
              indicator: +indicator.marker,
              json: this.writingSingleLine(line, indicator.Indicators),
              uid: this.newPlayerData.playerId,
              matchId: this.currentMatchId,
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
      //console.log(this.nowWriting);

      if (brackets.curly === 0 && brackets.squared === 0) {
        if (this.nowWriting === LoginIndicator) {
          const switchObject = findLastIndex(
            this.results,
            elem => elem.indicator === LoginIndicator
          );
          /*console.log(this.nowWriting);
          console.log(this.results);
          console.log(switchObject);*/

          // tslint:disable-next-line: no-any
          const bi: any = JSON.parse(this.results[switchObject].json);
          const loginNfo = bi.params.payloadObject;
          switch (bi.params.messageName) {
            case 'Client.Connected':
              /*console.log(
                source +
                  'Client.Connected:' +
                  loginNfo.playerId +
                  '/' +
                  this.newPlayerData.playerId
              );*/
              if (this.newPlayerData.playerId !== loginNfo.playerId) {
                this.newPlayerData.language =
                  loginNfo.settings.language.language;
                this.newPlayerData.playerId = loginNfo.playerId;
                this.newPlayerData.screenName = loginNfo.screenName;
                this.userswitched = true;
                this.skiplines = linesread;
                this.emitter.emit('userchange', this.newPlayerData);
                this.results = [];
              }
              break;
            case 'DuelScene.GameStart':
              //console.log(this.results);
              //console.log(source + ':' + loginNfo.matchId + '/' + linesread);
              if (this.currentMatchId !== loginNfo.matchId) {
                this.currentMatchId = loginNfo.matchId;
                this.newmatch = true;
                this.skiplines = linesread;
              }
              break;
            case 'DuelScene.EndOfMatchReport':
              this.currentMatchId = '';
              break;
          }
        }
        this.nowWriting = 0;
      }
    });

    rl.on('close', () => {
      if (!this.logsdisabled && !this.userswitched && !this.newmatch) {
        this.loglen = newloglen;
      }
      if (this.results.length > 0 && !this.logsdisabled && !this.userswitched) {
        this.emitter.emit(
          'status',
          `Log parsed till: ${format(
            new Date(this.results[this.results.length - 1].time),
            'h:mm:ss a dd, MMM yyyy'
          )}`
        );
      } else if (!this.logsdisabled && !this.userswitched && this.firstread) {
        this.emitter.emit('status', 'Awaiting updates...');
        this.firstread = false;
      }
      if (!this.userswitched) {
        this.emitter.emit(
          'newdata',
          this.results.filter(
            result => this.indicators[result.indicator].Send === 'true'
          )
        );
      }
      //console.log(this.results);
      this.results = [];
      if (this.newmatch) {
        this.newmatch = false;
        this.checkLog(this.path, fs.statSync(this.path), 'newmatch');
      }
    });
  }

  private parseDate(line: string) {
    const cutter = line.indexOf(': ');
    const shift = '[UnityCrossThreadLogger]'.length;
    let dt = new Date();
    try {
      dt = parse(
        line
          .replace('[UnityCrossThreadLogger]', '')
          .substring(0, cutter !== -1 ? cutter - shift : undefined),
        this.dateformats[this.userlang],
        new Date()
      );
    } catch (e) {}
    return dt.getTime();
  }

  private checkjson(line: string): boolean {
    const brackets = { curly: 0, squared: 0 };
    brackets.curly =
      brackets.curly + substrcount(line, '{') - substrcount(line, '}');

    brackets.squared =
      brackets.squared + substrcount(line, '[') - substrcount(line, ']');

    if (brackets.curly === 0 && brackets.squared === 0 && line.length > 0) {
      return true;
    } else {
      return false;
    }
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
    if (line.trim() === '') {
      return brackets;
    }
    const append = this.results.findIndex(
      elem =>
        +elem.indicator === +this.nowWriting &&
        +elem.time === this.strdate + this.doppler[this.strdate]
    );

    if (append !== -1) {
      if (!this.checkjson(this.results[append].json)) {
        this.results[append].json += line.trim();
        return this.bracketeer(line, brackets);
      } else {
        this.doppler[this.strdate]++;
        this.results.push({
          time: this.strdate + this.doppler[this.strdate],
          indicator: this.nowWriting,
          json: line.trim(),
          uid: this.newPlayerData.playerId,
          matchId: this.currentMatchId,
        });
        return this.bracketeer(line, { curly: 0, squared: 0 });
      }
    } else {
      this.results.push({
        time: this.strdate + this.doppler[this.strdate],
        indicator: this.nowWriting,
        json: line.trim(),
        uid: this.newPlayerData.playerId,
        matchId: this.currentMatchId,
      });
      return this.bracketeer(line, { curly: 0, squared: 0 });
    }
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
      result += char.trim();
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
