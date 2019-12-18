import {LogEvent, LogFileParsingState, ParsingMetadata, RawLogEvent, StatefulLogEvent} from 'root/app/log-parser/model';
import {asArray, asMap, asNumber, asString} from 'root/lib/type_utils';

export function parseEvent(data: string, state: LogFileParsingState, options: ParsingMetadata): StatefulLogEvent[] {
  const rawEvent = parseAsRawEvent(data);
  if (rawEvent === undefined) {
    return [];
  }
  const timestamp = getEventTimestamp(rawEvent);
  if (timestamp !== undefined) {
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
  }
  const statefulEvents = events.map(e => logEventToStatefulEvent(e, state));
  for (const event of events) {
    if (event.name === options.matchEndEvent) {
      handleMatchEndEvent(event, state);
    }
  }
  return statefulEvents;
}

export function logEventToStatefulEvent(event: LogEvent, state: LogFileParsingState): StatefulLogEvent {
  return {...event, userId: state.userId, matchId: state.matchId, timestamp: state.timestamp};
}

export function handleUserChangeEvent(event: LogEvent, state: LogFileParsingState): void {
  const userId = asString(extractValue(event.data, ['params', 'payloadObject', 'playerId']));
  const screenName = asString(extractValue(event.data, ['params', 'payloadObject', 'screenName']));
  state.userId = userId;
  state.screenName = screenName;
}

export function handleMatchStartEvent(event: LogEvent, state: LogFileParsingState): void {
  const matchId = asString(extractValue(event.data, ['params', 'payloadObject', 'matchId']));
  state.matchId = matchId;
}

export function handleMatchEndEvent(event: LogEvent, state: LogFileParsingState): void {
  state.matchId = undefined;
}

export function getEventTimestamp(rawEvent: RawLogEvent): number | undefined {
  const timeFromRawData = asNumber(extractValue(rawEvent.rawData, ['timestamp']));
  if (timeFromRawData !== undefined) {
    const epoch = 621355968000000000;
    return Math.floor((timeFromRawData - epoch) / (10 * 1000));
  }
  const timeFromData = asString(extractValue(rawEvent.data, ['params', 'payloadObject', 'timestamp']));
  if (timeFromData !== undefined) {
    try {
      return Date.parse(timeFromData);
    } catch {}
  }
  return undefined;
}

export function postProcessEvent(rawEvent: RawLogEvent, options: ParsingMetadata): LogEvent[] {
  const parsingOptions = options.events.find(o => o.name.toUpperCase() === rawEvent.name.toUpperCase());
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
    parsingOptions.subEvents.forEach(subEvent => {
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

export function parseAsRawEvent(value: string): RawLogEvent | undefined {
  const firstOpenCurlyBraces = value.indexOf('{');
  // No JSON, this is not an event we care about
  if (firstOpenCurlyBraces === -1) {
    return undefined;
  }
  // Found a {, we parse the data as JSON
  try {
    const eventName = postProcessEventName(value.slice(0, firstOpenCurlyBraces));
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
  if (dataMap.request !== undefined) {
    return parseAsJSONIfNeeded(dataMap.request);
  }
  if (dataMap.payload !== undefined) {
    return parseAsJSONIfNeeded(dataMap.payload);
  }
  const eventNameUpperCase = eventName.toUpperCase();
  const eventNameProperty = Object.keys(dataMap).find(attr => attr.toUpperCase() === eventNameUpperCase);
  if (eventNameProperty !== undefined) {
    return parseAsJSONIfNeeded(dataMap[eventNameProperty]);
  }
  return undefined;
}

// tslint:disable-next-line:no-any
export function parseAsJSONIfNeeded(data: any): any {
  // The heuristic here is that we will parse the data as a JSON if it's a
  // non-empty string that starts with '{'
  if (typeof data === 'string' && data.length > 0 && data[0] === '{') {
    try {
      return JSON.parse(data);
    } catch (err) {}
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
