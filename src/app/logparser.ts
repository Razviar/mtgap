export const test = true;
// import {format} from 'date-fns';
// import {app} from 'electron';
// import fs from 'fs';
// import path from 'path';
// import readline from 'readline';

// import {getindicators} from 'root/api/getindicators';
// import {LogParserEventEmitter, PlayerData} from 'root/app/log_parser_events';
// import {Cut, findLastIndex, substrcount} from 'root/lib/func';
// import {error} from 'root/lib/logger';
// import {Indicators, ParseResults} from 'root/models/indicators';

// export class LogParser {
//   private readonly path: string;
//   private indicators: Indicators[] = [];
//   private loglen: number = 0;
//   private loglencheck: number = 0;
//   private skiplines: number = 0;
//   private strdate: number = 0;
//   private readonly timestampregexp: RegExp = /"timestamp": "([\d]{18})"/m;
//   private nowWriting: number = 0;
//   private results: ParseResults[] = [];
//   private logsdisabled: boolean = false;
//   private userswitched: boolean = false;
//   private newmatch: boolean = false;
//   private firstread: boolean = true;
//   private watcher: NodeJS.Timeout | undefined;
//   private readonly parseOnce: boolean = false;
//   private readonly newPlayerData: PlayerData = {playerId: '', screenName: '', language: ''};
//   private currentMatchId: string = '';
//   private readonly doppler = new Map<number, Map<number, number>>();
//   private catchingUp = true;

//   public emitter = new LogParserEventEmitter();

//   constructor(targetname: string[] | string, pathset?: boolean, parseOnce?: boolean) {
//     if (!pathset) {
//       const appDataPath = app.getPath('appData');
//       this.path = path.join(appDataPath, ...targetname).replace('Roaming\\', '');
//     } else {
//       this.path = targetname as string;
//     }
//     if (parseOnce) {
//       this.parseOnce = true;
//     }
//   }

//   public start(): void {
//     const Interval = 250;
//     getindicators()
//       .then(i => {
//         if (i.indicators.length === 0) {
//           throw new Error('Missing indicators');
//         }
//         this.indicators = i.indicators;
//         this.loglen = 0;
//         this.loglencheck = 0;
//         if (this.parseOnce) {
//           this.checkLog(this.path, fs.statSync(this.path), 'parseOnce');
//         } else {
//           this.watcher = setInterval(this.watch.bind(this), Interval);
//         }

//         if (!fs.existsSync(this.path)) {
//           this.emitter.emit('error', 'No log file found');
//         }
//       })
//       .catch(e => {
//         error('start.getindicators', e);
//         this.emitter.emit('error', 'Connection Error');
//       });
//   }

//   public watch(): void {
//     if (fs.existsSync(this.path)) {
//       const stats = fs.statSync(this.path);
//       if (stats.size !== this.loglencheck) {
//         this.loglencheck = stats.size;
//         this.checkLog(this.path, stats, 'watcher');
//       }
//     }
//   }

//   public stop(): void {
//     this.logsdisabled = false;
//     if (this.watcher) {
//       clearInterval(this.watcher);
//     }
//   }

//   public setPlayerId(plid: string, pname: string): void {
//     if (this.newPlayerData.playerId === plid && this.newPlayerData.screenName === pname) {
//       this.userswitched = false;
//       this.checkLog(this.path, fs.statSync(this.path), 'setPlayerId');
//     }
//   }

//   public checkLog(pth: string, stats: fs.Stats | undefined, source?: string): void {
//     //console.log(pth + '///' + this.loglen + '///' + this.skiplines);
//     const LoginIndicator = 21;
//     let brackets = {curly: 0, squared: 0};
//     let linesread = 0;
//     let skip = this.skiplines;

//     let newloglen = 0;
//     if (stats) {
//       newloglen = stats.size;
//       if (newloglen < this.loglen) {
//         this.loglen = 0;
//         this.skiplines = 0;
//       }
//     } else {
//       this.loglen = 0;
//       this.skiplines = 0;
//     }

//     const stream = fs.createReadStream(pth, {
//       encoding: 'utf8',
//       autoClose: true,
//       start: this.loglen,
//     });

//     const rl = readline.createInterface({
//       input: stream,
//     });

//     rl.on('line', line => {
//       let foundIndicator = false;

//       if (skip > 0) {
//         skip--;
//         return;
//       }

//       /*if (line.includes('[UnityCrossThreadLogger]') && line.match(this.dateregexp)) {
//         this.strdateUnparsed = line;
//       }*/

//       const tstfinder = line.match(this.timestampregexp);
//       if (tstfinder) {
//         const epoch = 621355968000000000;
//         const ticks = 10000;
//         const tst: number = Math.floor((parseInt(tstfinder[1], 10) - epoch) / ticks);
//         this.strdate = tst;
//         //console.log(tstfinder[1] + '-' + epoch + '=' + tst);
//         //this.strdateUnparsed = line;
//       }

//       if (line.includes('DETAILED LOGS: DISABLED')) {
//         this.logsdisabled = true;
//         this.skiplines += linesread;
//         this.emitter.emit('error', 'Enable Detailed Logs!');
//         rl.close();
//       }

//       if (line.includes('DETAILED LOGS: ENABLED')) {
//         this.logsdisabled = false;
//       }

//       if (line.includes('"language": ') && !line.includes('null')) {
//         const param = Cut(line, '"language": "', '"');
//         //this.userlang = param;
//         if (!this.logsdisabled) {
//           this.emitter.emit('language', param);
//         }
//       }
//       linesread++;
//       if (this.logsdisabled || this.userswitched || this.newmatch) {
//         return;
//       }
//       //console.log(source + ':' + line);
//       this.indicators.forEach(indicator => {
//         if (line.includes(indicator.Indicators)) {
//           /*if (this.strdateUnparsed !== '') {
//             this.strdate = this.parseDate(this.strdateUnparsed);
//             console.log(this.strdateUnparsed + '!' + this.strdate);
//           }*/
//           line = line.replace(/(\\r\\n)/gm, '');
//           line = line.replace(/^(\[[\d]{1,}\][\s])?\[UnityCrossThreadLogger\]/gm, '');
//           //console.log(line);

//           let currentDoppler = this.doppler.get(this.strdate);
//           if (!currentDoppler) {
//             currentDoppler = new Map<number, number>();
//             this.doppler.set(this.strdate, currentDoppler);
//           }

//           const oldCurrentDopplerMarker = currentDoppler.get(indicator.marker);
//           let newCurrentDopplerMarker = oldCurrentDopplerMarker === undefined ? 0 : oldCurrentDopplerMarker;
//           if (oldCurrentDopplerMarker !== newCurrentDopplerMarker) {
//             currentDoppler.set(indicator.marker, newCurrentDopplerMarker);
//           }

//           if (line.length < 100 && !line.includes('{') && !line.includes('[')) {
//             this.nowWriting = +indicator.marker;
//             foundIndicator = true;
//             brackets = this.bracketeer(line, brackets);
//             let pusher = '';
//             if (line.includes('{')) {
//               pusher = '{';
//             }
//             if (line.includes('[')) {
//               pusher = '[';
//             }

//             if (pusher !== '') {
//               const append = this.results.findIndex(
//                 elem => +elem.indicator === +this.nowWriting && +elem.time === this.strdate + newCurrentDopplerMarker
//               );

//               if (append !== -1) {
//                 if (this.checkjson(this.results[append].json)) {
//                   newCurrentDopplerMarker++;
//                   currentDoppler.set(indicator.marker, newCurrentDopplerMarker);
//                 }
//               }

//               this.results.push({
//                 time: this.strdate + newCurrentDopplerMarker,
//                 indicator: +indicator.marker,
//                 json: pusher,
//                 uid: this.newPlayerData.playerId,
//                 matchId: this.currentMatchId,
//               });
//             }
//           } else {
//             const occurances = substrcount(line, indicator.Indicators);
//             let position = 0;
//             for (let k = 0; k < occurances; k++) {
//               const parsed = this.writingSingleLine(line, indicator.Indicators, position);
//               if (
//                 indicator.Needtohave === '' ||
//                 (indicator.Needtohave !== '' && parsed.result.includes(indicator.Needtohave))
//               ) {
//                 //console.log(indicator.Needtohave);
//                 this.results.push({
//                   // TODO - Should this be `newCurrentDopplerMarker + 1` instead?
//                   time: this.strdate + newCurrentDopplerMarker,
//                   indicator: +indicator.marker,
//                   json: parsed.result,
//                   uid: this.newPlayerData.playerId,
//                   matchId: this.currentMatchId,
//                 });
//                 // tslint:disable-next-line: no-magic-numbers
//                 const CHECK_BATTLE_EVENT_MARKER = [5, 16];
//                 if (CHECK_BATTLE_EVENT_MARKER.includes(+indicator.marker) && !this.catchingUp) {
//                   this.checkBattleEvents(parsed.result, +indicator.marker);
//                 }
//               }

//               position = parsed.dopler;
//               currentDoppler.set(indicator.marker, newCurrentDopplerMarker + 1);
//             }
//             if (+indicator.marker === LoginIndicator) {
//               this.checkEvents(LoginIndicator, linesread, rl);
//             }
//           }
//         }
//       });

//       if (foundIndicator) {
//         return;
//       }

//       if (this.nowWriting !== 0) {
//         brackets = this.writing(line, brackets);
//       }
//       //console.log(this.nowWriting);

//       if (brackets.curly === 0 && brackets.squared === 0) {
//         /*if (this.nowWriting === 17) {
//           const switchObject = findLastIndex(this.results, elem => elem.indicator === 17);
//            console.log(source);
//           console.log(this.results[switchObject]);
//         }*/
//         //console.log(this.nowWriting);
//         if (this.nowWriting === LoginIndicator) {
//           this.checkEvents(LoginIndicator, linesread, rl);
//         }

//         this.nowWriting = 0;
//       }
//     });

//     rl.on('close', () => {
//       if (this.results.length > 0 && !this.logsdisabled && !this.userswitched) {
//         this.emitter.emit(
//           'status',
//           `Log parsed till: ${format(new Date(this.results[this.results.length - 1].time), 'h:mm:ss a dd, MMM yyyy')}`
//         );
//       } else if (!this.logsdisabled && !this.userswitched && this.firstread) {
//         this.emitter.emit('status', 'Awaiting updates...');
//         this.firstread = false;
//       }
//       if (!this.userswitched) {
//         this.emitter.emit('newdata', {
//           events: this.results.filter(result => this.indicators[result.indicator].Send === 'true' && result.time !== 0),
//         });
//         /*console.log('EMITTER!');
//         console.log(this.loglen + '/' + this.skiplines);*/
//       }

//       if (!this.logsdisabled && !this.userswitched && !this.newmatch) {
//         this.loglen = newloglen;
//         this.skiplines = 0;
//         if (this.parseOnce) {
//           this.emitter.emit('old-log-complete', undefined);
//         }
//         this.catchingUp = false;
//       }
//       //console.log(this.results);
//       this.results = [];
//       if (this.newmatch) {
//         this.newmatch = false;
//         this.checkLog(this.path, fs.statSync(this.path), 'newmatch');
//       }

//       stream.destroy();
//     });
//   }

//   private checkEvents(LoginIndicator: number, linesread: number, rl: readline.Interface): void {
//     const switchObject = findLastIndex(this.results, elem => elem.indicator === LoginIndicator);
//     /*console.log(this.nowWriting);
//       console.log(this.results);
//       console.log(switchObject);*/

//     // tslint:disable-next-line: no-any
//     //console.log('???');

//     if (switchObject === -1) {
//       return;
//     }
//     //console.log(this.results[switchObject].json);
//     let json: any = false;
//     let bi: any = false;
//     try {
//       json = JSON.parse(this.results[switchObject].json);
//       bi = JSON.parse(json.request);
//     } catch (e) {}
//     //console.log('!!!');
//     //console.log(bi);
//     if (!bi || !bi.params) {
//       return;
//     }
//     const loginNfo = bi.params.payloadObject;
//     if (loginNfo.timestamp !== undefined) {
//       this.strdate = Date.parse(bi.params.payloadObject.timestamp);
//       //this.strdateUnparsed = '';
//       //console.log(this.strdate);
//     }
//     switch (bi.params.messageName) {
//       case 'Client.Connected':
//         //console.log('Client.Connected:' + linesread + '/' + loginNfo.playerId + '/' + this.newPlayerData.playerId);
//         if (this.newPlayerData.playerId !== loginNfo.playerId) {
//           this.newPlayerData.language = loginNfo.settings.language.language;
//           this.newPlayerData.playerId = loginNfo.playerId;
//           this.newPlayerData.screenName = loginNfo.screenName;
//           this.userswitched = true;
//           this.skiplines += linesread;
//           this.results = [];
//           this.emitter.emit('userchange', this.newPlayerData);
//           rl.close();
//         }
//         break;
//       case 'DuelScene.GameStart':
//         //console.log(this.results);
//         //console.log(linesread + ':' + loginNfo.matchId + '/' + linesread);
//         if (this.currentMatchId !== loginNfo.matchId) {
//           this.currentMatchId = loginNfo.matchId;
//           this.newmatch = true;
//           this.skiplines += linesread;
//           this.emitter.emit('match-started', {
//             matchId: loginNfo.matchId,
//             gameNumber: loginNfo.gameNumber,
//             seatId: loginNfo.seatId,
//           });
//           rl.close();
//         }
//         break;
//       case 'DuelScene.EndOfMatchReport':
//         this.emitter.emit('match-over', loginNfo.matchId);
//         this.currentMatchId = '';
//         break;
//     }
//   }

//   private checkBattleEvents(json: string, marker: number): void {
//     const gameObj = 5;
//     const mulliganResp = 16;
//     switch (marker) {
//       case gameObj:
//         try {
//           const gameObjects: {[index: string]: string}[] = JSON.parse(json);
//           if (gameObjects[0].type) {
//             gameObjects.forEach(gobj => {
//               if (gobj.type === 'GameObjectType_Card') {
//                 this.emitter.emit('card-played', {
//                   instanceId: parseFloat(gobj.instanceId),
//                   grpId: parseFloat(gobj.grpId),
//                   zoneId: parseFloat(gobj.zoneId),
//                   visibility: gobj.visibility,
//                   ownerSeatId: parseFloat(gobj.ownerSeatId),
//                 });
//               }
//             });
//           }
//         } catch (e) {}
//         break;
//       case mulliganResp:
//         try {
//           const mulliganResponce: {[index: string]: string} = JSON.parse(json);
//           if (mulliganResponce.mulliganCount && +mulliganResponce.mulliganCount > 0) {
//             this.emitter.emit('mulligan', true);
//           }
//         } catch (e) {}
//         break;
//     }
//   }

//   /*private parseDate(line: string) {
//     const cutter = line.indexOf(': ');
//     const shift = '[UnityCrossThreadLogger]'.length;
//     let dt = new Date();
//     try {
//       dt = parse(
//         line.replace('[UnityCrossThreadLogger]', '').substring(0, cutter !== -1 ? cutter - shift : undefined),
//         this.dateformats[this.userlang],
//         new Date()
//       );
//     } catch (e) {}
//     return dt.getTime();
//   }*/

//   private checkjson(line: string): boolean {
//     const brackets = {curly: 0, squared: 0};
//     brackets.curly = brackets.curly + substrcount(line, '{') - substrcount(line, '}');

//     brackets.squared = brackets.squared + substrcount(line, '[') - substrcount(line, ']');

//     if (brackets.curly === 0 && brackets.squared === 0 && line.length > 0) {
//       return true;
//     } else {
//       return false;
//     }
//   }

//   private bracketeer(line: string, brackets: {curly: number; squared: number}): {curly: number; squared: number} {
//     brackets.curly = brackets.curly + substrcount(line, '{') - substrcount(line, '}');

//     brackets.squared = brackets.squared + substrcount(line, '[') - substrcount(line, ']');

//     return brackets;
//   }

//   private writing(line: string, brackets: {curly: number; squared: number}): {curly: number; squared: number} {
//     if (line.trim() === '') {
//       return brackets;
//     }

//     const indicatorMarker = this.indicators[this.nowWriting].marker;
//     const currentDoppler = this.doppler.get(this.strdate);
//     const dopplerFromMarker = currentDoppler && currentDoppler.get(indicatorMarker);
//     let safeDopplerFromMarker = dopplerFromMarker === undefined ? 0 : dopplerFromMarker;

//     const append = this.results.findIndex(
//       elem => +elem.indicator === +this.nowWriting && +elem.time === this.strdate + safeDopplerFromMarker
//     );

//     if (append !== -1) {
//       if (!this.checkjson(this.results[append].json)) {
//         this.results[append].json += line.trim();
//         return this.bracketeer(line, brackets);
//       } else {
//         safeDopplerFromMarker++;

//         if (currentDoppler) {
//           currentDoppler.set(indicatorMarker, safeDopplerFromMarker);
//         } else {
//           this.doppler.set(
//             this.strdate,
//             new Map<number, number>([[indicatorMarker, safeDopplerFromMarker]])
//           );
//         }
//         this.results.push({
//           time: this.strdate + safeDopplerFromMarker,
//           indicator: this.nowWriting,
//           json: line.trim(),
//           uid: this.newPlayerData.playerId,
//           matchId: this.currentMatchId,
//         });
//         return this.bracketeer(line, {curly: 0, squared: 0});
//       }
//     } else {
//       this.results.push({
//         time: this.strdate + safeDopplerFromMarker,
//         indicator: this.nowWriting,
//         json: line.trim(),
//         uid: this.newPlayerData.playerId,
//         matchId: this.currentMatchId,
//       });
//       return this.bracketeer(line, {curly: 0, squared: 0});
//     }
//   }

//   private writingSingleLine(line: string, indicator: string, doppler: number): {result: string; dopler: number} {
//     const pos = line.indexOf(indicator, doppler);
//     const workingline = line.substring(pos + indicator.length);
//     const brackets = {curly: 0, squared: 0};
//     let result = '';
//     let i = 0;

//     /*if (indicator == '"turnInfo":') {
//       console.log('!!!!!!!!!!!!');
//       console.log(pos + '/' + doppler);
//       console.log(workingline);
//     }*/

//     while (brackets.curly === 0 && brackets.squared === 0 && i < workingline.length) {
//       const char = workingline.charAt(i);
//       switch (char) {
//         case '{':
//           brackets.curly++;
//           result += char;
//           break;
//         case '[':
//           brackets.squared++;
//           result += char;
//           break;
//       }
//       i++;
//     }

//     while ((brackets.curly > 0 || brackets.squared > 0) && i < workingline.length) {
//       const char = workingline.charAt(i);
//       result += char;
//       switch (char) {
//         case '{':
//           brackets.curly++;
//           break;
//         case '[':
//           brackets.squared++;
//           break;
//         case '}':
//           brackets.curly--;
//           break;
//         case ']':
//           brackets.squared--;
//           break;
//       }
//       i++;
//     }

//     return {result, dopler: line.indexOf(indicator, doppler) + indicator.length + i};
//   }
// }
