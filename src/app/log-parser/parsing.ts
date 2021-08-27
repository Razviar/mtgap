import {LogEvent, LogFileParsingState, ParsingMetadata, RawLogEvent, StatefulLogEvent} from 'root/app/log-parser/model';
import {asArray, asMap, asNumber, asString} from 'root/lib/type_utils';

export function parseEvent(
  data: string,
  state: LogFileParsingState,
  options: ParsingMetadata,
  oldlog?: boolean
): StatefulLogEvent[] {
  const rawEvent = parseAsRawEvent(data);
  if (rawEvent === undefined) {
    return [];
  }
  const timestamp = getEventTimestamp(rawEvent);
  //console.log(rawEvent);
  //console.log('got-timestamp', timestamp);
  if (timestamp !== undefined && +timestamp > 0) {
    state.timestamp = timestamp;
  }
  const events = postProcessEvent(rawEvent, options);

  for (const event of events) {
    if (event.name === options.userChangeEvent) {
      handleUserChangeEvent(event, state);
    }
    if (event.name === options.matchStartEvent) {
      handleMatchStartEvent(event, state);
    }
    if (event.name === options.TurnInfoAllEvent) {
      handleTurnEvent(event, state);
    }
    if (event.name === options.PlayersInfoEvent) {
      handlePlayersInfoEvent(event, state);
    }
  }
  const statefulEvents = events.map((e) => logEventToStatefulEvent(e, state));
  for (const event of events) {
    if (event.name === options.matchEndEvent) {
      handleMatchEndEvent(event, state);
    }
  }
  return statefulEvents;
}

export function logEventToStatefulEvent(event: LogEvent, state: LogFileParsingState): StatefulLogEvent {
  return {
    ...event,
    userId: state.userId,
    matchId: state.matchId,
    timestamp: state.timestamp,
    turnNumber: state.turnNumber,
    lifeTotals: {pl1: state.lifeTotals?.pl1, pl2: state.lifeTotals?.pl2},
  };
}

export function handleUserChangeEvent(event: LogEvent, state: LogFileParsingState): void {
  const userId = asString(extractValue(event.data, ['params', 'payloadObject', 'playerId']));
  const screenName = asString(extractValue(event.data, ['params', 'payloadObject', 'screenName']));
  state.userId = userId;
  state.screenName = screenName;
}

export function handleMatchStartEvent(event: LogEvent, state: LogFileParsingState): void {
  const matchId = asString(extractValue(event.data, ['gameRoomInfo', 'gameRoomConfig', 'matchId']));
  state.matchId = matchId;
}

export function handlePlayersInfoEvent(event: LogEvent, state: LogFileParsingState): void {
  const pl1 = asNumber(extractValue(event.data, [0, 'lifeTotal']));
  const pl2 = asNumber(extractValue(event.data, [1, 'lifeTotal']));
  state.lifeTotals = {pl1, pl2};
}

export function handleTurnEvent(event: LogEvent, state: LogFileParsingState): void {
  const turnNumber = asNumber(extractValue(event.data, ['turnNumber']));
  state.turnNumber = turnNumber;
}

export function handleMatchEndEvent(event: LogEvent, state: LogFileParsingState): void {
  state.matchId = undefined;
  state.turnNumber = undefined;
  state.lifeTotals = {pl1: undefined, pl2: undefined};
}

export function getEventTimestamp(rawEvent: RawLogEvent): number | undefined {
  const timeFromRawData = asNumber(extractValue(rawEvent.rawData, ['timestamp']));
  /*console.log('---------------------');
  console.log('timeFromRawData', timeFromRawData);*/
  if (timeFromRawData !== undefined) {
    const epoch = 621355968000000000;
    return +timeFromRawData > epoch ? Math.floor((timeFromRawData - epoch) / (10 * 1000)) : Math.floor(timeFromRawData);
  }
  const timeFromData = asString(extractValue(rawEvent.data, ['params', 'payloadObject', 'timestamp']));
  //console.log('timeFromData', timeFromData);
  if (timeFromData !== undefined) {
    try {
      return Date.parse(timeFromData);
    } catch {}
  }
  if (rawEvent.name == '==> LogBusinessEvents') {
    if (rawEvent.data !== undefined && rawEvent.data.EventTime !== undefined) {
      try {
        return Date.parse(rawEvent.data.EventTime);
      } catch {}
    }
  }

  //console.log('returning undefined');
  return undefined;
}

export function postProcessEvent(rawEvent: RawLogEvent, options: ParsingMetadata): LogEvent[] {
  const parsingOptions = options.events.find((o) => o.name.toUpperCase() === rawEvent.name.toUpperCase());
  if (parsingOptions === undefined) {
    return [];
  }
  const toLogEvent = () => {
    const name = parsingOptions.newName !== undefined ? parsingOptions.newName : rawEvent.name;
    return {...rawEvent, name, indicator: parsingOptions.indicator};
  };

  if (parsingOptions.constraint !== undefined) {
    const value = extractValue(rawEvent.data, parsingOptions.constraint.attributesPath);
    if (Array.isArray(parsingOptions.constraint.value)) {
      if (!parsingOptions.constraint.value.includes(value)) {
        return [];
      }
    } else {
      if (value !== parsingOptions.constraint.value) {
        return [];
      }
    }
  }
  if (parsingOptions.multiEvents !== undefined) {
    const subEventsData = asArray(extractValue(rawEvent.data, parsingOptions.multiEvents.attributesPath));
    if (subEventsData !== undefined) {
      let subEvents: LogEvent[] = [];
      for (const subEventData of subEventsData) {
        subEvents = subEvents.concat(
          postProcessEvent(
            {name: parsingOptions.multiEvents.subEventName, data: subEventData, rawData: subEventData},
            options
          )
        );
      }
      if (parsingOptions.indicator !== undefined) {
        subEvents.push(toLogEvent());
      }
      return subEvents;
    }
  }
  if (parsingOptions.renamer !== undefined) {
    const newName = asString(extractValue(rawEvent.data, parsingOptions.renamer));
    if (newName !== undefined) {
      const events = postProcessEvent({...rawEvent, name: newName}, options);
      if (parsingOptions.indicator !== undefined) {
        events.push(toLogEvent());
      }
      return events;
    }
  }
  if (parsingOptions.subEvents !== undefined) {
    let subEvents: LogEvent[] = [];
    parsingOptions.subEvents.forEach((subEvent) => {
      const data = extractValue(rawEvent.data, subEvent.attributesPath);
      if (data !== undefined) {
        subEvents = subEvents.concat(
          postProcessEvent(
            {
              name: subEvent.subEventName,
              data,
              rawData: data,
            },
            options
          )
        );
      }
    });
    if (parsingOptions.indicator !== undefined) {
      subEvents.push(toLogEvent());
    }
    return subEvents;
  }

  return [toLogEvent()];
}

function isClosingEvent(eventName: string): boolean {
  return ['FrontDoorConnection.Close', 'Client.TcpConnection.Close', 'FrontDoorConnection.Open'].includes(eventName);
}

export function parseAsRawEvent(value: string): RawLogEvent | undefined {
  const firstOpenCurlyBraces = value.indexOf('{');
  const firstOpenRoundBraces = value.indexOf('(');
  const nameLimiter =
    firstOpenRoundBraces !== -1 && firstOpenRoundBraces < firstOpenCurlyBraces
      ? firstOpenRoundBraces
      : firstOpenCurlyBraces;
  // No JSON, this is not an event we care about
  if (firstOpenCurlyBraces === -1) {
    return undefined;
  }
  // Found a {, we parse the data as JSON
  try {
    const eventName = postProcessEventName(value.slice(0, nameLimiter));
    if (isClosingEvent(eventName)) {
      return {name: eventName, data: {}, rawData: {}};
    }
    const rawData = JSON.parse(value.slice(firstOpenCurlyBraces));
    const data = extractEventData(eventName, rawData);
    if (data === undefined) {
      return undefined;
    }
    return {name: eventName, data, rawData};
  } catch (err) {
    // Failure to parse the JSON, this is not a valid event for us
    return undefined;
  }
}

const timedMessageRegex = /^[0-9]{1,4}[\/.:-][0-9]{1,4}[\/.:-][0-9]{1,4}/;

export function postProcessEventName(message: string): string {
  // Some messages are time based. For those we only care of the last part
  if (message.match(timedMessageRegex)) {
    const fragments = message.split(' ');
    return fragments[fragments.length - 1].trim();
  }
  // For the other, we trim the whitespaces. Can't hurt.
  return message.trim();
}

// tslint:disable-next-line:no-any
export function extractEventData(eventName: string, rawData: any): any | undefined {
  const dataMap = asMap(rawData);
  if (dataMap === undefined) {
    return undefined;
  }
  // Events have the data stored on different attributes. It can be found:
  // - on the `request` attribute. This is generally (but not exclusively) found on "==> ***" events
  // - on the `payload` attribute. This is generally (but not exclusively) found on "<== ***" events
  // - on an attribute that is the `eventName`, but camel cased
  // - as first layer of JSON for Draft.Notify
  if (dataMap.request !== undefined) {
    const requestExtracted = parseAsJSONIfNeeded(dataMap.request);
    if (requestExtracted.Payload !== undefined) {
      return parseAsJSONIfNeeded(requestExtracted.Payload);
    } else {
      return requestExtracted;
    }
  }
  if (dataMap.payload !== undefined) {
    return parseAsJSONIfNeeded(dataMap.payload);
  }
  if (dataMap.Payload !== undefined) {
    return parseAsJSONIfNeeded(dataMap.payload);
  }

  const eventNameUpperCase = eventName.toUpperCase();
  const eventNameProperty = Object.keys(dataMap).find((attr) => attr.toUpperCase() === eventNameUpperCase);
  if (eventNameProperty !== undefined) {
    return parseAsJSONIfNeeded(dataMap[eventNameProperty]);
  }
  if (eventName === 'Draft.Notify') {
    return parseAsJSONIfNeeded(dataMap);
  } else {
    return undefined;
  }
}

// tslint:disable-next-line:no-any
export function parseAsJSONIfNeeded(data: any): any {
  // The heuristic here is that we will parse the data as a JSON if it's a
  // non-empty string that starts with '{'
  if (typeof data === 'string' && data.length > 0 && data[0] === '{') {
    try {
      return JSON.parse(data);
    } catch (err) {
      console.log('Error parsing JSON', err);
    }
  }
  return data;
}

// tslint:disable-next-line:no-any
export function extractValue(data: any, attributesPath: (number | string)[]): any {
  let value = data;
  for (const attribute of attributesPath) {
    value = asMap(value, {})[attribute];
  }
  return value;
}
