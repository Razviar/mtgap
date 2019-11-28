import {Card} from 'root/models/cards';

export const minmax = [
  ['maxusage', 'battleusage', 1],
  ['minusage', 'battleusage', -1],
  ['maxusagedraft', 'battleusage_draft', 1],
  ['minusagedraft', 'battleusage_draft', -1],
  ['maxwleval', 'wleval', 1],
  ['minwleval', 'wleval', -1],
  ['maxwleval_draft', 'wleval_draft', 1],
  ['minwleval_draft', 'wleval_draft', -1],
  ['maxdrafteval2', 'drafteval2', 1],
  ['mindrafteval2', 'drafteval2', -1],
  ['maxprice', 'market', 1],
];

export function sortcards(
  allcards: {
    [index: number]: Card;
  },
  asc: boolean,
  srttype: number
): [string, Card][] {
  const sorts = [
    'battleusage',
    'wleval',
    'drafteval2',
    'wleval_draft',
    'battleusage_draft',
    'convmana',
    'market',
    'power',
    'toughness',
    'rarity',
    'cardid',
    'likemtga',
    'name',
  ];

  const cards: [string, Card][] = Object.entries(allcards).sort((a, b) => {
    const likemtga = 11;
    const cardid = 10;

    if (+srttype < cardid) {
      const sorter = sorts[+srttype] as
        | 'battleusage'
        | 'wleval'
        | 'drafteval2'
        | 'wleval_draft'
        | 'battleusage_draft'
        | 'market'
        | 'convmana'
        | 'power'
        | 'toughness'
        | 'rarity';
      return (asc ? a[1][sorter] : b[1][sorter]) - (asc ? b[1][sorter] : a[1][sorter]);
    } else if (+srttype === cardid) {
      return (
        (asc ? parseInt(a[1]['cardid'], 10) : parseInt(b[1]['cardid'], 10)) -
        (asc ? parseInt(b[1]['cardid'], 10) : parseInt(a[1]['cardid'], 10))
      );
    } else if (+srttype === likemtga) {
      const colororder = ['White', 'Blue', 'Black', 'Red', 'Green', 'Colorless', 'Multicolor'];
      const aIsLand = a[1].is_land;
      const aColorIndicator = colororder.indexOf(a[1].colorindicator);
      const aConvMana = a[1].convmana;
      const aName = a[1].name;
      const bIsLand = b[1].is_land;
      const bColorIndicator = colororder.indexOf(b[1].colorindicator);
      const bConvMana = b[1].convmana;
      const bName = b[1].name;
      let result = 1;

      result =
        aIsLand === bIsLand
          ? aColorIndicator === bColorIndicator
            ? aConvMana === bConvMana
              ? aName.localeCompare(bName)
              : aConvMana - bConvMana
            : aColorIndicator - bColorIndicator
          : bIsLand - aIsLand;

      return result;
    } else {
      const sorter = sorts[+srttype] as 'name';
      return asc ? a[1][sorter].localeCompare(b[1][sorter]) : b[1][sorter].localeCompare(a[1][sorter]);
    }
  });

  return cards;
}
