// tslint:disable:no-any

type AnyMapOrEmpty =
  | {
      [key: string]: any;
    }
  | {};
export interface AnyMap {
  [key: string]: any;
}
export function asMap(value: any): {[key: string]: any} | undefined;
export function asMap(value: any, defaultValue: AnyMapOrEmpty): AnyMap;
export function asMap(value: any, defaultValue?: AnyMapOrEmpty): AnyMap | undefined {
  return typeof value === 'object' && value !== null ? (value as AnyMap) : defaultValue;
}

export function asArray<T = any>(value: any): T[] | undefined;
export function asArray<T = any>(value: any, defaultValue: T[]): T[];
export function asArray<T = any>(value: any, defaultValue?: T[]): T[] | undefined {
  return Array.isArray(value) ? (value as T[]) : defaultValue;
}

export function asNumber(value: any): number | undefined;
export function asNumber(value: any, defaultValue: number): number;
export function asNumber(value: any, defaultValue?: number): number | undefined {
  if (typeof value === 'number') {
    return !isNaN(value) ? value : defaultValue;
  }
  if (typeof value === 'string') {
    try {
      const parsedValue = parseFloat(value);
      return !isNaN(parsedValue) ? parsedValue : defaultValue;
    } catch (e) {
      return defaultValue;
    }
  }
  return defaultValue;
}

export function asBoolean(value: any): boolean | undefined;
export function asBoolean(value: any, defaultValue: boolean): boolean;
export function asBoolean(value: any, defaultValue?: boolean): boolean | undefined {
  if (typeof value === 'boolean') {
    return value;
  }
  if (typeof value === 'number') {
    return !isNaN(value) ? value !== 0 : false;
  }
  if (typeof value === 'string') {
    if (value === '0' || value === 'false') {
      return false;
    } else if (value === '1' || value === 'true') {
      return true;
    } else {
      return defaultValue;
    }
  }
  return defaultValue;
}

export function asString(value: any): string | undefined;
export function asString(value: any, defaultValue: string): string;
export function asString(value: any, defaultValue?: string): string | undefined {
  return typeof value === 'string' ? value : defaultValue;
}

export function asNumberString(value: any): string | undefined;
export function asNumberString(value: any, defaultValue: string): string;
export function asNumberString(value: any, defaultValue?: string): string | undefined {
  return typeof value === 'string' ? value : typeof value === 'number' ? String(value) : defaultValue;
}

export function asFunction(value: any): Function | undefined;
export function asFunction(value: any, defaultValue: Function): Function;
export function asFunction(value: any, defaultValue?: Function): Function | undefined {
  return typeof value === 'function' ? (value as Function) : defaultValue;
}

export function asDate(value: any): Date | undefined;
export function asDate(value: any, defaultValue: Date): Date;
export function asDate(value: any, defaultValue?: Date): Date | undefined {
  if (typeof value === 'number') {
    return new Date(value);
  }
  return value instanceof Date ? value : defaultValue;
}

export function asStringMap(value: any): Map<string, string> | undefined {
  const map = asMap(value);
  if (map === undefined) {
    return undefined;
  }
  const res = new Map<string, string>();
  Object.keys(map).forEach((key) => res.set(key, asString(map[key], '')));
  return res;
}

// tslint:enable:no-any

// tslint:disable-next-line:no-any
export function errorAsString(err: any): string {
  let errorString = asString(err);
  if (errorString === undefined) {
    if (typeof err === 'object' && err !== null) {
      errorString = (err as object).toString();
    }
    errorString = errorString === undefined ? String(err) : errorString;
  }
  return errorString;
}

export function asParsedJSON<T>(json: string): T {
  try {
    return JSON.parse(json) as T;
  } catch {
    const defaultValue = {};
    return defaultValue as T;
  }
}

export function notUndefined<T>(val: T | undefined): val is T {
  return val !== undefined;
}

export function removeUndefined<T>(arr: (T | undefined)[]): T[] {
  return arr.filter(notUndefined);
}

export type Omit<T, K extends keyof T> = Pick<T, Exclude<keyof T, K>>;
export type Brand<Type, Name> = Type & {__brand: Name};
export interface FlatObject {
  [key: string]: string | number | boolean | undefined;
}
export type Untrusted<T> = {
  [P in keyof T]: any; // tslint:disable-line:no-any
};

export function hasOwnProperty<X extends {}, Y extends PropertyKey>(obj: X, prop: Y): obj is X & Record<Y, unknown> {
  return obj.hasOwnProperty(prop);
}
