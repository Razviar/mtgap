import {sumOfObject} from 'root/lib/func';
import {currentMatch, overlayConfig} from 'root/windows/overlay/overlay';

export function genBattleCardNum(mtgaid: number): string {
  if (!overlayConfig.metaData) {
    return '';
  }

  const cid = overlayConfig.metaData.mtgatoinnerid[+mtgaid];
  const num = currentMatch.myFullDeck.find(fd => fd.card === +cid);
  if (!num) {
    return '';
  }

  const numleft = currentMatch.decks.me[+mtgaid] > 0 ? num.cardnum - currentMatch.decks.me[+mtgaid] : num.cardnum;
  const cardsPlayed = sumOfObject(currentMatch.decks.me);
  const draw = `${(100 * (numleft / (currentMatch.totalCards - cardsPlayed))).toFixed(2)}%`;

  const digits: ('leftdigit' | 'rightdigit' | 'bottomdigit')[] = ['leftdigit', 'rightdigit', 'bottomdigit'];
  const digitsFilled: Map<string, string> = new Map();
  digits.forEach(digit => {
    if (!overlayConfig.ovlSettings) {
      return;
    }
    switch (overlayConfig.ovlSettings[digit]) {
      case 1:
        digitsFilled.set(digit, numleft.toString());
        break;
      case 2:
        digitsFilled.set(digit, num.cardnum.toString());
        break;
      case 3:
        digitsFilled.set(digit, draw);
        break;
      case 4:
        digitsFilled.set(digit, '');
        break;
    }
  });

  const numbers = `<div class="uppernum">${
    digitsFilled.get('leftdigit') !== undefined
      ? `<div class="leftuppernum">${digitsFilled.get('leftdigit')}</div>`
      : ''
  } ${digitsFilled.get('rightdigit') !== undefined ? digitsFilled.get('rightdigit') : ''}</div>${
    digitsFilled.get('bottomdigit') !== undefined
      ? `<div class="bottomnum">${digitsFilled.get('bottomdigit')}</div>`
      : ''
  }`;
  if (numleft === 0) {
    const crdEl: HTMLElement | null = document.getElementById(`card${mtgaid}me`);
    if (crdEl) {
      crdEl.classList.add(overlayConfig.ovlSettings && overlayConfig.ovlSettings.hidezero ? 'hidden' : 'outCard');
    }
  }
  return numbers;
}
