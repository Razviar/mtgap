import {overlayConfig, overlayElements} from 'root/windows/overlay/overlay';

export const HoverEventListener = (theCard: Element) => {
  const minHeight = 500;
  const imgWidth = 200;

  if (!overlayConfig.metaData) {
    return '';
  }
  const cardsdb = overlayConfig.metaData.allcards;

  theCard.addEventListener('mouseenter', (event: Event) => {
    if (!overlayConfig.ovlSettings?.cardhover) {
      return;
    }

    const cl: HTMLElement = event.target as HTMLElement;
    const cid = cl.getAttribute('data-cid') as string;
    const side = cl.getAttribute('data-side') as string;
    const src = `https://mtgarena.pro/mtg/pict/${
      cardsdb[+cid].has_hiresimg === 1 ? `mtga/card_${cardsdb[+cid].mtga_id}_EN.png` : cardsdb[+cid].pict
    }`;
    overlayElements.CardHint.innerHTML = `<img src="${src}"/>`;

    const positioner: {
      pos: ClientRect | DOMRect;
      moPos: ClientRect | DOMRect;
      cardPosHeight: number;
      maxTop: number;
      hintTop: number;
    } = {
      pos: cl.getBoundingClientRect(),
      moPos:
        side === 'me'
          ? overlayElements.MainDeckFrame.getBoundingClientRect()
          : overlayElements.OpponentOutFrame.getBoundingClientRect(),
      cardPosHeight: 268,
      maxTop: 0,
      hintTop: 0,
    };

    positioner.maxTop =
      positioner.moPos.top + positioner.moPos.height > minHeight
        ? positioner.moPos.top + positioner.moPos.height
        : minHeight;
    positioner.hintTop =
      positioner.pos.top + positioner.cardPosHeight < positioner.maxTop
        ? positioner.pos.top
        : positioner.pos.bottom - positioner.cardPosHeight;

    overlayElements.CardHint.style.left = `${
      side === 'me' ? positioner.pos.left + positioner.pos.width : positioner.pos.left - imgWidth
    }px`;
    overlayElements.CardHint.style.top = `${positioner.hintTop}px`;
    overlayElements.CardHint.classList.remove('hidden');
  });
  theCard.addEventListener('mouseleave', () => {
    overlayElements.CardHint.classList.add('hidden');
  });
};
