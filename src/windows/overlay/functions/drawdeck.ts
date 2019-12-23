import {colorforfilter} from 'root/lib/utils';
import {makeCard} from 'root/windows/overlay/functions/drawcard';
import {HoverEventListener} from 'root/windows/overlay/functions/hovereventlistener';
import {currentMatch, overlayConfig, overlayElements, toggleButtonClass} from 'root/windows/overlay/overlay';

export function drawDeck(): void {
  let output = '';
  currentMatch.myFullDeck.forEach(card => {
    output += makeCard(card.card, card.cardnum, true);
  });
  output += `<div class="deckBottom${
    overlayConfig.ovlSettings?.fontcolor === 2
      ? ' White'
      : overlayConfig.ovlSettings?.fontcolor === 1
      ? ' LightGrey'
      : ' DarkGrey'
  }">`;
  for (let scls = 0; scls <= 2; scls++) {
    output += `<div id="scls${scls}" class="scls"></div>`;
  }
  for (let cf = 0; cf <= colorforfilter.length - 2; cf++) {
    output += `<div id="landclr${colorforfilter[cf]}" class="scls"></div>`;
  }
  output += '</div>';
  overlayElements.DeckName.classList.add(
    overlayConfig.ovlSettings?.fontcolor === 2
      ? 'White'
      : overlayConfig.ovlSettings?.fontcolor === 1
      ? 'LightGrey'
      : 'DarkGrey'
  );
  overlayElements.DeckName.innerHTML = currentMatch.humanname;
  overlayElements.MainOut.innerHTML = output;
  if (!overlayConfig.ovlSettings?.hidemy) {
    overlayElements.MainDeckFrame.classList.remove('hidden');
    toggleButtonClass(overlayElements.ToggleMe, overlayElements.MainDeckFrame.classList.contains('hidden'));
  }
  const AllCards = document.getElementsByClassName('DcDrow');
  Array.from(AllCards).forEach(theCard => {
    HoverEventListener(theCard);
  });
}
