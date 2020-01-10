import {sortcards} from 'root/lib/sortcards';
import {Card} from 'root/models/cards';
import {HoverEventListener} from 'root/windows/overlay/functions/hovereventlistener';
import {makeCard} from 'root/windows/overlay/functions/makecard';
import {currentDraft, overlayConfig, overlayElements, toggleButtonClass} from 'root/windows/overlay/overlay';

export function drawDraft(): void {
  if (!overlayConfig.metaData) {
    return;
  }

  const sortByPicks = 2;
  const sortByWL = 3;
  const sortLikeMTGA = 11;

  const Sortby =
    overlayConfig.ovlSettings?.leftdraftdigit === 1
      ? sortByPicks
      : overlayConfig.ovlSettings?.leftdraftdigit === 2
      ? sortByWL
      : sortLikeMTGA;
  const meta = overlayConfig.metaData;
  const allcards = overlayConfig.allCards;
  const forsort: {[index: number]: Card} = {};

  currentDraft.currentPack.forEach(card => {
    const cid = meta.mtgatoinnerid[+card];
    forsort[+cid] = allcards.get(+cid) as Card;
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
