import {sortcards} from 'root/lib/sortcards';
import {Card} from 'root/models/cards';
import {makeCard} from 'root/windows/overlay/functions/drawcard';
import {HoverEventListener} from 'root/windows/overlay/functions/hovereventlistener';
import {currentMatch, overlayConfig, overlayElements, toggleButtonClass} from 'root/windows/overlay/overlay';

export function updateOppDeck(highlight: number[]): void {
  if (!overlayConfig.metaData) {
    return;
  }
  const SortLikeMTGA = 11;
  const meta = overlayConfig.metaData;
  const oppDeck: {[index: number]: number} = {};
  const forsort: {[index: number]: Card} = {};

  Object.keys(currentMatch.decks.opponent).forEach(OppMtgaCid => {
    if (Object.keys(meta.mtgatoinnerid).includes(OppMtgaCid)) {
      const cid = meta.mtgatoinnerid[+OppMtgaCid];
      oppDeck[+cid] = currentMatch.decks.opponent[+OppMtgaCid];
      forsort[+cid] = meta.allcards[+cid];
    }
  });
  let output = '';

  sortcards(forsort, true, SortLikeMTGA).forEach(cid => {
    output += makeCard(+cid[0], oppDeck[+cid[0]], false);
  });

  overlayElements.OpponentOut.innerHTML = output;
  if (!overlayConfig.ovlSettings?.hideopp) {
    overlayElements.OpponentOutFrame.classList.remove('hidden');
    toggleButtonClass(overlayElements.ToggleOpp, overlayElements.OpponentOutFrame.classList.contains('hidden'));
  }

  highlight.forEach(mtgaid => {
    const crdEl: HTMLElement | null = document.getElementById(`card${mtgaid}opp`);
    if (crdEl) {
      crdEl.classList.add('highlightCard');
    }
  });

  setTimeout(() => {
    Array.from(document.getElementsByClassName('highlightCard')).forEach(el => {
      el.classList.remove('highlightCard');
    });
  }, overlayConfig.highlightTimeout);

  const AllCards = document.getElementsByClassName('DcDrow');
  Array.from(AllCards).forEach(theCard => {
    HoverEventListener(theCard);
  });
}
