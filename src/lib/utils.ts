// Welcome to the kingdom of chaos
// tslint:disable: no-magic-numbers

import {Card} from 'root/models/cards';

// tslint:disable: no-any
export const types = ['Aggro', 'Mid-Range', 'Control'];
export const typecolor = ['bfb66b', '4693b9', '5e5b5a', 'c35d3a', '448359', 'ababab', 'ababab'];
export const typecolorletter: {[index: string]: string} = {
  White: 'bfb66b',
  Blue: '4693b9',
  Black: '4e4442',
  Red: 'c35d3a',
  Green: '448359',
  Multicolor: 'ababab',
  Colorless: '7a7777',
};
export const redgreen = ['b01d00', 'c04900', 'd48600', 'd4b500', 'a5b200', '6da000', '038600'];
export const rarcolor = ['888', '888', '447484', 'a36b00', 'cf5b25'];
export const rarcolorbars = ['474747', '474747', '255464', '5b3c00', '5f2311'];
export const color = ['Colorless', 'White', 'Blue', 'Black', 'Red', 'Green', 'Multicolor'];
export const colorforfilter = ['White', 'Blue', 'Black', 'Red', 'Green', 'Colorless', 'Multicolor'];
export const rarity = ['Land', 'Common', 'Uncommon', 'Rare', 'Mythic'];
export const colorletter = ['W', 'U', 'B', 'R', 'G', 'C', 'dfc-ignite'];
export const manafont: {[s: string]: string} = {
  white: 'w',
  blue: 'u',
  black: 'b',
  red: 'r',
  green: 'g',
  colorless: 'c',
  'black/green': 'bg',
  'black/red': 'br',
  'green/blue': 'gu',
  'green/white': 'gw',
  'red/green': 'rg',
  'red/white': 'rw',
  'blue/black': 'ub',
  'blue/red': 'ur',
  'white/black': 'wb',
  'white/blue': 'wu',
  multicolor: 'dfc-ignite',
};
export const superclassfont: {[index: string]: string} = {
  'Non-Creature': 'sorcery',
  Creature: 'creature',
  Land: 'land',
};

export function cardSuperclass(card: Card): number {
  if (card['is_land'] === 1) {
    return 2;
  } else if (card['txttype'].includes('Creature')) {
    return 1;
  } else {
    return 0;
  }
}

export const selectStyles = {
  control: () => ({
    backgroundColor: '#36221e',
    borderBottom: '1px solid #774b43',
    display: 'flex',
    flexWrap: 'wrap' as 'wrap',
    justifyContent: 'space-between',
    position: 'relative' as 'relative',
    boxSizing: 'border-box' as 'border-box',
    height: '32px',
    overflow: 'hidden',
    '>div': {
      height: '32px',
      overflow: 'hidden',
    },
  }),
  singleValue: () => ({
    color: '#9f9f9f',
    cursor: 'pointer',
    'white-space': 'nowrap',
    overflow: 'hidden',
  }),
  menuList: (provided: any) => ({
    ...provided,
    '::-webkit-scrollbar': {
      width: '5px',
    },
    '::-webkit-scrollbar-track': {
      background: 'rgba(0, 0, 0, 0)',
    },
    '::-webkit-scrollbar-thumb': {
      background: '#925c51',
    },
    '::-webkit-scrollbar-thumb:hover': {
      background: '#a7695d',
    },
  }),
  menu: (provided: any) => ({
    ...provided,
    backgroundColor: '#4e312b',
    color: '#9f9f9f',
    border: '1px solid #83524a',
    borderRadius: '0',
    padding: '0',
  }),
  // option: (provided: any, state: any) => ({
  //   ...provided,
  //   backgroundColor: state.isSelected ? 'rgba(132,52,38,.9)' : state.isFocused ? '#a7695d' : '',
  //   color: state.isFocused ? 'white' : '',
  // }),
  indicatorSeparator: () => ({
    display: 'none',
  }),
  indicatorsContainer: () => ({
    padding: '2px',
    height: '32px',
    transition: 'color 150ms',
    color: 'hsl(0,0%,80%)',
    '>div': {
      padding: '2px 0 0 0;',
    },
  }),
  input: (provided: any) => ({...provided, color: '#9f9f9f'}),
};

export const titles: {[index: string]: string} = {
  my: 'My Deck Lists',
  'my-mtga': 'My MTGA Linked Deck Lists',
  'my-historic': 'My Historic Deck Lists',
  'my-singleton': 'My Singleton Deck Lists',
  'my-pauper': 'My Pauper Deck Lists',
  'my-precon': 'My Precon Deck Lists',
  'my-draft': 'My Draft Deck Lists',
  fav: 'Favorite Deck Lists',
  craft: 'Crafting Deck Lists',
  sub: 'Susbcriptions Deck Lists',
  community: 'MTG Arena Community Deck Lists',
  historic: 'MTG Arena Historic Deck Lists',
  singleton: 'MTG Arena Singleton Deck Lists',
  precon: 'MTG Arena Starting (Preconstructed) Deck Lists',
  pauper: 'MTG Arena Pauper Deck Lists',
  meta: 'MTG Arena Meta Deck Lists',
  'meta-bo3': 'MTG Arena Meta BO3 Deck Lists',
  'historic-meta': 'MTG Arena Historic Metagame',
  budget: 'MTG Arena Budget Deck Lists',
  forevent: 'Best Performing MTGA Decks in Event',
  brawl: 'MTG Arena Brawl Deck Lists',
  artisan: 'MTG Arena Artisan Deck Lists (Common + Uncommon)',
};

export const possibemodes = [
  'community',
  'historic',
  'meta',
  'meta-bo3',
  'historic-meta',
  'budget',
  'singleton',
  'pauper',
  'precon',
  'brawl',
  'artisan',
  'my',
  'fav',
  'sub',
  'craft',
  'my-mtga',
  'my-historic',
  'my-singleton',
  'my-pauper',
  'my-precon',
  'my-draft',
];

export async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function lz(n: number): string {
  return n >= 10 ? n.toString() : `0${n}`;
}

export function isMac(): boolean {
  return process.platform === 'darwin';
}
