import {sortcards} from 'root/lib/sortcards';
import {Card} from 'root/models/cards';
import {makeCard} from 'root/windows/overlay/drawcard';
import {HoverEventListener} from 'root/windows/overlay/hovereventlistener';
import {currentDraft, overlayConfig, overlayElements, toggleButtonClass} from 'root/windows/overlay/overlay';

export function drawDraft(): void {
  if (!overlayConfig.metaData) {
    return;
  }

  const Sortby =
    overlayConfig.ovlSettings?.leftdraftdigit === 1 ? 2 : overlayConfig.ovlSettings?.leftdraftdigit === 2 ? 3 : 11;
  const meta = overlayConfig.metaData;
  const forsort: {[index: number]: Card} = {};

  currentDraft.currentPack.forEach(card => {
    const cid = meta.mtgatoinnerid[+card];
    forsort[+cid] = meta.allcards[+cid];
  });
  let output = `<div class="deckName"><strong>Pack: ${currentDraft.PackNumber + 1} / Pick: ${currentDraft.PickNumber +
    1}</strong></div>`;

  sortcards(forsort, false, Sortby).forEach(cid => {
    output += makeCard(+cid[0], 1, true, true);
  });

  overlayElements.MainOut.innerHTML = output;
  overlayElements.MainDeckFrame.classList.remove('hidden');
  toggleButtonClass(overlayElements.ToggleMe, overlayElements.MainDeckFrame.classList.contains('hidden'));

  const AllCards = document.getElementsByClassName('DcDrow');
  Array.from(AllCards).forEach(theCard => {
    HoverEventListener(theCard);
  });
}
