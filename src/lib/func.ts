// Welcome to the kingdom of chaos
// tslint:disable: no-magic-numbers
// tslint:disable: no-any no-unsafe-any

import {redgreen} from 'root/lib/utils';

export function countOfObject(obj: any): number {
  const t = typeof obj;
  if (t !== 'object' || obj === null) {
    return 0;
  }
  return Object.keys(obj).length;
}

export function sumOfObject(obj: any): number {
  const t = typeof obj;
  let i = 0;
  if (t !== 'object' || obj === null) {
    return 0;
  }
  Object.keys(obj).forEach((key) => (i += parseInt(obj[key], 10)));
  return i;
}

export function jsonParse(input: any): any {
  if (typeof input === 'string') {
    try {
      return JSON.parse(input);
    } catch (e) {
      return {};
    }
  }
  return input;
}
export function hexToRgbA(hex: string): string {
  let c: any;
  if (/^#([A-Fa-f0-9]{3}){1,2}$/.test(hex)) {
    c = hex.substring(1).split('');
    if (+c.length === 3) {
      c = [c[0], c[0], c[1], c[1], c[2], c[2]];
    }
    c = `0x${c.join('')}`;
    // tslint:disable-next-line: no-bitwise
    return `rgba(${[(c >> 16) & 255, (c >> 8) & 255, c & 255].join(',')},1)`;
  }
  throw new Error('Bad Hex');
}
export function LZ(time: number): string {
  return time >= 10 ? time.toString() : `0${time.toString()}`;
}
export function shuffle(a: number[] | string[]): number[] | string[] {
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
export function CountSteps(wrpercent: number): number {
  const minwl = 30;
  const maxwl = 60;
  const stepping = (maxwl - minwl) / redgreen.length;
  let clrange = 0;
  if (wrpercent > minwl) {
    if (wrpercent > maxwl) {
      clrange = redgreen.length - 1;
    } else {
      clrange = Math.floor((wrpercent - minwl) / stepping) - 1;
      if (clrange < 0) {
        clrange = 0;
      }
      if (clrange >= redgreen.length - 1) {
        clrange = redgreen.length - 1;
      }
    }
  }
  return clrange;
}
export function getRandomInt(max: number): number {
  return Math.floor(Math.random() * Math.floor(max));
}

export function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .replace(/\s+/g, '-') // Replace spaces with -
    .replace(/[^\w\-]+/g, '') // Remove all non-word chars
    .replace(/\-\-+/g, '-') // Replace multiple - with single -
    .replace(/^-+/, '') // Trim - from start of text
    .replace(/-+$/, ''); // Trim - from end of text
}

export function jsUcfirst(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

export function substrcount(str: string, subString: string, allowOverlapping?: boolean): number {
  str += '';
  subString += '';
  if (subString.length <= 0) {
    return str.length + 1;
  }

  let n = 0;
  let pos = 0;
  const step = allowOverlapping ? 1 : subString.length;

  while (true) {
    pos = str.indexOf(subString, pos);
    if (pos >= 0) {
      ++n;
      pos += step;
    } else {
      break;
    }
  }
  return n;
}

export function Cut(str: string, from: string, to: string, offset?: number): string {
  const startIndex = str.indexOf(from, offset);
  const endIndex = str.indexOf(to, startIndex + from.length);
  if (startIndex !== -1 && endIndex !== -1) {
    const result = str.substring(startIndex + from.length, endIndex);
    return result;
  } else {
    return '';
  }
}
