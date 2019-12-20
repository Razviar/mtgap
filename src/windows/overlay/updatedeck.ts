import {sumOfObject} from 'root/lib/func';
import {genBattleCardNum} from 'root/windows/overlay/genbattlecardnum';
import {currentMatch, overlayConfig, superclasses} from 'root/windows/overlay/overlay';

export function updateDeck(highlight: number[]): void {
  if (!overlayConfig.metaData) {
    return;
  }
  const meta = overlayConfig.metaData;

  currentMatch.myFullDeck.forEach(card => {
    const mtgaid = meta.allcards[+card.card].mtga_id;
    const crdTxtEl: HTMLElement | null = document.getElementById(`cardnum${mtgaid}me`);
    if (crdTxtEl !== null) {
      crdTxtEl.innerHTML = genBattleCardNum(mtgaid);
    }
  });
  highlight.forEach(mtgaid => {
    const cid = meta.mtgatoinnerid[+mtgaid];
    const scls = meta.allcards[+cid].supercls !== undefined ? meta.allcards[+cid].supercls : 0;
    if (!currentMatch.cardsBySuperclassLeft.has(scls.toString())) {
      currentMatch.cardsBySuperclassLeft.set(scls.toString(), 1);
    } else {
      const n = currentMatch.cardsBySuperclassLeft.get(scls.toString()) as number;
      currentMatch.cardsBySuperclassLeft.set(scls.toString(), n + 1);
    }

    const crdEl: HTMLElement | null = document.getElementById(`card${mtgaid}me`);
    if (crdEl) {
      crdEl.classList.add('highlightCard');
      setTimeout(() => {
        Array.from(document.getElementsByClassName('highlightCard')).forEach(el => {
          el.classList.remove('highlightCard');
        });
      }, overlayConfig.highlightTimeout);
    }
  });

  for (let scls = 0; scls <= 2; scls++) {
    const sclsEl: HTMLElement | null = document.getElementById(`scls${scls}`);
    if (sclsEl) {
      const cardsBySuperclass = currentMatch.cardsBySuperclass.get(scls.toString());
      const cardsBySuperclassLeft = currentMatch.cardsBySuperclassLeft.get(scls.toString());
      if (cardsBySuperclass !== undefined && cardsBySuperclassLeft !== undefined) {
        const numleft = cardsBySuperclass - cardsBySuperclassLeft;
        const cardsPlayed = sumOfObject(currentMatch.decks.me);
        const draw = (100 * (numleft / (currentMatch.totalCards - cardsPlayed))).toFixed(2);
        sclsEl.innerHTML = `<span class="ms ms-${superclasses[scls]}">${numleft}|${draw}%`;
      }
    }
  }
}
