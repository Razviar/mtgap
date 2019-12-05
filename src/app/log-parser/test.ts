export const testCode = true;
// import {parseLogFile} from 'root/app/log-parser/main';
// import {LogParser} from 'root/app/logparser';
// import {asMap, asNumber} from 'root/lib/type_utils';
// import {ParseResults} from 'root/models/indicators';

// export async function getEventsWithOldParser(path: string): Promise<ParseResults[]> {
//   return new Promise<ParseResults[]>((resolve, reject) => {
//     const logParser = new LogParser(path, true, true);
//     logParser.emitter.on('newdata', data => {
//       console.log(data);
//       resolve(data);
//     });
//     logParser.start();
//   });
// }

// export async function runTest(path: string): Promise<void> {
//   console.log('Parsing with old tracker');
//   const eventsFromOldParser = await getEventsWithOldParser(path);
//   console.log('Parsing with new tracker');
//   const eventsFromNewParser = await parseLogFile(path);
//   console.log(eventsFromOldParser.length, eventsFromNewParser.length);
// }

// let oldParserResults: ParseResults[] = [];
// let newParserResults: ParseResults[] = [];

// function compare(oldParserEvent: ParseResults, newParserEvent: ParseResults): void {
//   if (
//     JSON.stringify(JSON.parse(oldParserEvent.json)) !== JSON.stringify(JSON.parse(newParserEvent.json)) ||
//     oldParserEvent.matchId !== newParserEvent.matchId ||
//     oldParserEvent.uid !== newParserEvent.uid
//   ) {
//     console.log('-----------------------');
//     console.log('OLD');
//     console.log(oldParserEvent.json);
//     console.log('NEW');
//     console.log(newParserEvent.json);
//     console.log('-----------------------');
//   }
// }

// export function stats(results: ParseResults[], isNewParser: boolean): void {
//   // console.log(results.filter(e => e.time <= 1));
//   const sorted = results
//     .sort((a, b) => {
//       if (a.time !== b.time) {
//         return a.time - b.time;
//       }
//       if (a.indicator !== b.indicator) {
//         return a.indicator - b.indicator;
//       }
//       return a.json.localeCompare(b.json);
//     })
//     .filter(e => e.time > 1)
//     .map(e => ({...e, time: Math.floor(e.time)}));

//   let oldTurnInfoCount = 0;
//   let oldTurnInfo1Count = 0;
//   let newTurnInfoCount = 0;
//   let newTurnInfo1Count = 0;

//   if (isNewParser) {
//     newParserResults = sorted;
//     sorted.forEach(e => {
//       if (asNumber(e.indicator) === 18) {
//         newTurnInfoCount++;
//         if (JSON.parse(e.json).turnNumber === 1) {
//           newTurnInfo1Count++;
//         }
//       }
//     });
//     console.log(newTurnInfoCount);
//     console.log(newTurnInfo1Count);
//   } else {
//     oldParserResults = sorted;
//     sorted.forEach(e => {
//       if (asNumber(e.indicator) === 18) {
//         oldTurnInfoCount++;
//         if (JSON.parse(e.json).turnNumber === 1) {
//           oldTurnInfo1Count++;
//         }
//       }
//     });
//     console.log(oldTurnInfoCount);
//     console.log(oldTurnInfo1Count);
//   }

//   if (!isNewParser) {
//     console.log('-----');
//     let oldParserEvent = oldParserResults.shift();
//     let newParserEvent = newParserResults.shift();
//     while (oldParserResults.length > 0) {
//       if (
//         oldParserEvent &&
//         newParserEvent &&
//         oldParserEvent.time === newParserEvent.time &&
//         oldParserEvent.indicator === newParserEvent.indicator
//       ) {
//         compare(oldParserEvent, newParserEvent);
//         oldParserEvent = oldParserResults.shift();
//         newParserEvent = newParserResults.shift();
//       } else {
//         // console.log('Skipping');
//         // if (newParserEvent && oldParserEvent) {
//         //   console.log(newParserEvent.time, newParserEvent.indicator);
//         //   console.log(oldParserEvent.time, oldParserEvent.indicator);
//         // }
//         oldParserEvent = oldParserResults.shift();
//       }
//     }
//     console.log('Left: ', newParserResults.length);
//   }
//   const groups = new Map<number, ParseResults[]>();
//   results.forEach(r => {
//     const group = groups.get(r.indicator);
//     if (group === undefined) {
//       groups.set(r.indicator, [r]);
//     } else {
//       group.push(r);
//     }
//   });
//   Array.from(groups.keys())
//     .sort()
//     .forEach(i => {
//       const group = (groups.get(i) || []).sort((a, b) => a.time - b.time);
//       console.log(i, '=>', group.length);
//       // console.log(`==== ${i} ====`);
//       // group.forEach(r => console.log(r));
//     });
// }
