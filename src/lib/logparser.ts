import {format} from 'date-fns';
import electron from 'electron';
import Emittery from 'emittery';
import fs from 'fs';
import path from 'path';
import readline from 'readline';
import {getindicators} from 'root/api/getindicators';
import {Indicators, ParseResults} from 'root/models/indicators';
import {Cut, findLastIndex, substrcount} from './func';

export class LogParser {
  private readonly path: string;
  private indicators: Indicators[] = [];
  /*private dateformats: { [index: string]: string } = {};
  private userlang = 'English';*/
  private loglen: number = 0;
  private loglencheck: number = 0;
  private skiplines: number = 0;
  private strdate: number = 0;
  /*private strdateUnparsed: string = '';
  private dateregexp: RegExp = /[\d]{1,2}[:./ ]{1,2}[\d]{1,2}/gm;*/
  private readonly timestampregexp: RegExp = /"timestamp": "([\d]{18})"/m;
  private nowWriting: number = 0;
  private results: ParseResults[] = [];
  private logsdisabled: boolean = false;
  private userswitched: boolean = false;
  private newmatch: boolean = false;
  private firstread: boolean = true;
  //private watcher: chokidar.FSWatcher;
  private watcher: NodeJS.Timeout | undefined;
  private readonly parseOnce: boolean = false;
  private readonly newPlayerData: {
    playerId: string;
    screenName: string;
    language: string;
  } = {playerId: '', screenName: '', language: ''};
  private currentMatchId: string = '';
  private readonly doppler: {[index: number]: {[index: number]: number}} = {};

  public emitter = new Emittery();

  constructor(targetname: string[] | string, pathset?: boolean, parseOnce?: boolean) {
    if (!pathset) {
      const appDataPath = (electron.app || electron.remote.app).getPath('appData');
      this.path = path.join(appDataPath, ...targetname).replace('Roaming\\', '');
    } else {
      this.path = targetname as string;
    }
    if (parseOnce) {
      this.parseOnce = true;
      //console.log('ParsingOnce' + this.path);
    }
  }

  public start() {
    const Interval = 250;
    //console.log('starting!');
    getindicators((electron.app || electron.remote.app).getVersion()).then(i => {
      /*console.log('!!');
      console.log(i);*/
      if (!i.indicators) {
        this.emitter.emit('error', 'Connection Error');
        return;
      }
      this.indicators = i.indicators;
      //this.dateformats = i.dates;
      this.loglen = 0;
      this.loglencheck = 0;
      if (this.parseOnce) {
        this.checkLog(this.path, fs.statSync(this.path), 'parseOnce');
      } else {
        this.watcher = setInterval(this.watch.bind(this), Interval);
      }

      if (!fs.existsSync(this.path)) {
        this.emitter.emit('error', 'No log file found');
      }
    });
  }

  public watch() {
    if (fs.existsSync(this.path)) {
      const stats = fs.statSync(this.path);
      if (stats.size !== this.loglencheck) {
        this.loglencheck = stats.size;
        this.checkLog(this.path, stats, 'watcher');
      }
    }
  }

  public stop() {
    this.logsdisabled = false;
    if (this.watcher) {
      clearInterval(this.watcher);
    }
  }

  public setPlayerId(plid: string, pname: string) {
    if (this.newPlayerData.playerId === plid && this.newPlayerData.screenName === pname) {
      this.userswitched = false;
      this.checkLog(this.path, fs.statSync(this.path), 'setPlayerId');
    }
  }

  public checkLog(pth: string, stats: fs.Stats | undefined, source?: string) {
    //console.log(pth + '///' + this.loglen + '///' + this.skiplines);
    const LoginIndicator = 21;
    let brackets = {curly: 0, squared: 0};
    let linesread = 0;
    let skip = this.skiplines;

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

    const stream = fs.createReadStream(pth, {
      encoding: 'utf8',
      autoClose: true,
      start: this.loglen,
    });

    const rl = readline.createInterface({
      input: stream,
    });

    rl.on('line', line => {
      let foundIndicator = false;

      if (skip > 0) {
        skip--;
        return;
      }

      /*if (line.includes('[UnityCrossThreadLogger]') && line.match(this.dateregexp)) {
        this.strdateUnparsed = line;
      }*/

      const tstfinder = line.match(this.timestampregexp);
      if (tstfinder) {
        const epoch = 621355968000000000;
        const ticks = 10000;
        const tst: number = Math.floor((parseInt(tstfinder[1], 10) - epoch) / ticks);
        this.strdate = tst;
        //console.log(tstfinder[1] + '-' + epoch + '=' + tst);
        //this.strdateUnparsed = line;
      }

      if (line.includes('DETAILED LOGS: DISABLED')) {
        this.logsdisabled = true;
        this.skiplines += linesread;
        this.emitter.emit('error', 'Enable Detailed Logs!');
        rl.close();
      }

      if (line.includes('DETAILED LOGS: ENABLED')) {
        this.logsdisabled = false;
      }

      if (line.includes('"language": ') && !line.includes('null')) {
        const param = Cut(line, '"language": "', '"');
        //this.userlang = param;
        if (!this.logsdisabled) {
          this.emitter.emit('language', param);
        }
      }
      linesread++;
      if (this.logsdisabled || this.userswitched || this.newmatch) {
        return;
      }
      //console.log(source + ':' + line);
      this.indicators.forEach(indicator => {
        if (line.includes(indicator.Indicators)) {
          /*if (this.strdateUnparsed !== '') {
            this.strdate = this.parseDate(this.strdateUnparsed);
            console.log(this.strdateUnparsed + '!' + this.strdate);
          }*/
          line = line.replace(/(\\r\\n)/gm, '');
          line = line.replace(/^(\[[\d]{1,}\][\s])?\[UnityCrossThreadLogger\]/gm, '');
          //console.log(line);
          if (!this.doppler[this.strdate]) {
            this.doppler[this.strdate] = {};
          }
          if (!this.doppler[this.strdate][+indicator.marker]) {
            this.doppler[this.strdate][+indicator.marker] = 0;
          }

          if (line.length < 100 && !line.includes('{') && !line.includes('[')) {
            this.nowWriting = +indicator.marker;
            foundIndicator = true;
            brackets = this.bracketeer(line, brackets);
            let pusher = '';
            if (line.includes('{')) {
              pusher = '{';
            }
            if (line.includes('[')) {
              pusher = '[';
            }

            if (pusher !== '') {
              const append = this.results.findIndex(
                elem =>
                  +elem.indicator === +this.nowWriting &&
                  +elem.time === this.strdate + this.doppler[this.strdate][+indicator.marker]
              );

              if (append !== -1) {
                if (this.checkjson(this.results[append].json)) {
                  this.doppler[this.strdate][+indicator.marker]++;
                }
              }

              this.results.push({
                time: this.strdate + this.doppler[this.strdate][+indicator.marker],
                indicator: +indicator.marker,
                json: pusher,
                uid: this.newPlayerData.playerId,
                matchId: this.currentMatchId,
              });
            }
          } else {
            const occurances = substrcount(line, indicator.Indicators);
            let position = 0;
            for (let k = 0; k < occurances; k++) {
              const parsed = this.writingSingleLine(line, indicator.Indicators, position);
              if (
                indicator.Needtohave === '' ||
                (indicator.Needtohave !== '' && parsed.result.includes(indicator.Needtohave))
              ) {
                //console.log(indicator.Needtohave);
                this.results.push({
                  time: this.strdate + this.doppler[this.strdate][+indicator.marker],
                  indicator: +indicator.marker,
                  json: parsed.result,
                  uid: this.newPlayerData.playerId,
                  matchId: this.currentMatchId,
                });
                if (indicator.marker === '5') {
                  this.checkBattleEvents(parsed.result);
                }
              }

              position = parsed.dopler;
              this.doppler[this.strdate][+indicator.marker]++;
            }
            if (+indicator.marker === LoginIndicator) {
              this.checkEvents(LoginIndicator, linesread, rl);
            }
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
        /*if (this.nowWriting === 17) {
          const switchObject = findLastIndex(this.results, elem => elem.indicator === 17);
           console.log(source);
          console.log(this.results[switchObject]);
        }*/
        //console.log(this.nowWriting);
        if (this.nowWriting === LoginIndicator) {
          this.checkEvents(LoginIndicator, linesread, rl);
        }

        this.nowWriting = 0;
      }
    });

    rl.on('close', () => {
      if (this.results.length > 0 && !this.logsdisabled && !this.userswitched) {
        this.emitter.emit(
          'status',
          `Log parsed till: ${format(new Date(this.results[this.results.length - 1].time), 'h:mm:ss a dd, MMM yyyy')}`
        );
      } else if (!this.logsdisabled && !this.userswitched && this.firstread) {
        this.emitter.emit('status', 'Awaiting updates...');
        this.firstread = false;
      }
      if (!this.userswitched) {
        this.emitter.emit(
          'newdata',
          this.results.filter(result => this.indicators[result.indicator].Send === 'true' && result.time !== 0)
        );
        /*console.log('EMITTER!');
        console.log(this.loglen + '/' + this.skiplines);*/
      }

      if (!this.logsdisabled && !this.userswitched && !this.newmatch) {
        this.loglen = newloglen;
        this.skiplines = 0;
        if (this.parseOnce) {
          this.emitter.emit('old-log-complete');
        }
      }
      //console.log(this.results);
      this.results = [];
      if (this.newmatch) {
        this.newmatch = false;
        this.checkLog(this.path, fs.statSync(this.path), 'newmatch');
      }

      stream.destroy();
    });
  }

  private checkEvents(LoginIndicator: number, linesread: number, rl: readline.Interface): void {
    const switchObject = findLastIndex(this.results, elem => elem.indicator === LoginIndicator);
    /*console.log(this.nowWriting);
      console.log(this.results);
      console.log(switchObject);*/

    // tslint:disable-next-line: no-any
    //console.log('???');

    if (switchObject === -1) {
      return;
    }
    //console.log(this.results[switchObject].json);
    let json: any = false;
    let bi: any = false;
    try {
      json = JSON.parse(this.results[switchObject].json);
      bi = JSON.parse(json.request);
    } catch (e) {}
    //console.log('!!!');
    //console.log(bi);
    if (!bi || !bi.params) {
      return;
    }
    const loginNfo = bi.params.payloadObject;
    if (loginNfo.timestamp !== undefined) {
      this.strdate = Date.parse(bi.params.payloadObject.timestamp);
      //this.strdateUnparsed = '';
      //console.log(this.strdate);
    }
    switch (bi.params.messageName) {
      case 'Client.Connected':
        //console.log('Client.Connected:' + linesread + '/' + loginNfo.playerId + '/' + this.newPlayerData.playerId);
        if (this.newPlayerData.playerId !== loginNfo.playerId) {
          this.newPlayerData.language = loginNfo.settings.language.language;
          this.newPlayerData.playerId = loginNfo.playerId;
          this.newPlayerData.screenName = loginNfo.screenName;
          this.userswitched = true;
          this.skiplines += linesread;
          this.results = [];
          this.emitter.emit('userchange', this.newPlayerData);
          rl.close();
        }
        break;
      case 'DuelScene.GameStart':
        //console.log(this.results);
        //console.log(linesread + ':' + loginNfo.matchId + '/' + linesread);
        if (this.currentMatchId !== loginNfo.matchId) {
          this.currentMatchId = loginNfo.matchId;
          this.newmatch = true;
          this.skiplines += linesread;
          this.emitter.emit('match-started', {
            matchId: loginNfo.matchId,
            gameNumber: loginNfo.gameNumber,
            seatId: loginNfo.seatId,
          });
          rl.close();
        }
        break;
      case 'DuelScene.EndOfMatchReport':
        this.emitter.emit('match-over', loginNfo.matchId);
        this.currentMatchId = '';
        break;
    }
  }

  private checkBattleEvents(json: string): void {
    try {
      const gameObjects: {[index: string]: string}[] = JSON.parse(json);
      if (gameObjects[0].type !== undefined) {
        gameObjects.forEach(gobj => {
          if (gobj.type === 'GameObjectType_Card') {
            this.emitter.emit('card-played', {
              instanceId: gobj.instanceId,
              grpId: gobj.grpId,
              zoneId: gobj.zoneId,
              visibility: gobj.visibility,
              ownerSeatId: gobj.ownerSeatId,
            });
          }
        });
      }
    } catch (e) {}
  }

  /*private parseDate(line: string) {
    const cutter = line.indexOf(': ');
    const shift = '[UnityCrossThreadLogger]'.length;
    let dt = new Date();
    try {
      dt = parse(
        line.replace('[UnityCrossThreadLogger]', '').substring(0, cutter !== -1 ? cutter - shift : undefined),
        this.dateformats[this.userlang],
        new Date()
      );
    } catch (e) {}
    return dt.getTime();
  }*/

  private checkjson(line: string): boolean {
    const brackets = {curly: 0, squared: 0};
    brackets.curly = brackets.curly + substrcount(line, '{') - substrcount(line, '}');

    brackets.squared = brackets.squared + substrcount(line, '[') - substrcount(line, ']');

    if (brackets.curly === 0 && brackets.squared === 0 && line.length > 0) {
      return true;
    } else {
      return false;
    }
  }

  private bracketeer(line: string, brackets: {curly: number; squared: number}) {
    brackets.curly = brackets.curly + substrcount(line, '{') - substrcount(line, '}');

    brackets.squared = brackets.squared + substrcount(line, '[') - substrcount(line, ']');

    return brackets;
  }

  private writing(line: string, brackets: {curly: number; squared: number}) {
    if (line.trim() === '') {
      return brackets;
    }
    const append = this.results.findIndex(
      elem =>
        +elem.indicator === +this.nowWriting &&
        +elem.time === this.strdate + this.doppler[this.strdate][+this.indicators[this.nowWriting].marker]
    );

    if (append !== -1) {
      if (!this.checkjson(this.results[append].json)) {
        this.results[append].json += line.trim();
        return this.bracketeer(line, brackets);
      } else {
        this.doppler[this.strdate][+this.indicators[this.nowWriting].marker]++;
        this.results.push({
          time: this.strdate + this.doppler[this.strdate][+this.indicators[this.nowWriting].marker],
          indicator: this.nowWriting,
          json: line.trim(),
          uid: this.newPlayerData.playerId,
          matchId: this.currentMatchId,
        });
        return this.bracketeer(line, {curly: 0, squared: 0});
      }
    } else {
      this.results.push({
        time: this.strdate + this.doppler[this.strdate][+this.indicators[this.nowWriting].marker],
        indicator: this.nowWriting,
        json: line.trim(),
        uid: this.newPlayerData.playerId,
        matchId: this.currentMatchId,
      });
      return this.bracketeer(line, {curly: 0, squared: 0});
    }
  }

  private writingSingleLine(line: string, indicator: string, doppler: number) {
    const pos = line.indexOf(indicator, doppler);
    const workingline = line.substring(pos + indicator.length);
    const brackets = {curly: 0, squared: 0};
    let result = '';
    let i = 0;

    /*if (indicator == '"turnInfo":') {
      console.log('!!!!!!!!!!!!');
      console.log(pos + '/' + doppler);
      console.log(workingline);
    }*/

    while (brackets.curly === 0 && brackets.squared === 0 && i < workingline.length) {
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

    while ((brackets.curly > 0 || brackets.squared > 0) && i < workingline.length) {
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

    return {result, dopler: line.indexOf(indicator, doppler) + indicator.length + i};
  }
}
