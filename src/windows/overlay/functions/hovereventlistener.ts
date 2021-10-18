import {overlayConfig, overlayElements} from 'root/windows/overlay/overlay';

export const HoverEventListener = (theCard: Element) => {
  const minHeight = 500;

  if (!overlayConfig.metaData) {
    return '';
  }
  const cardsdb = overlayConfig.allCards;

  theCard.addEventListener('mouseenter', (event: Event) => {
    if (!overlayConfig.ovlSettings?.cardhover) {
      return;
    }

    const cardHeight = 402;

    const cl: HTMLElement = event.target as HTMLElement;
    const cid = cl.getAttribute('data-cid') as string;
    const side = cl.getAttribute('data-side') as string;
    const Card = cardsdb.get(+cid);

    if (Card === undefined) {
      return;
    }

    const src = `https://mtgarena.pro/mtg/pict/${
      Card.has_hiresimg === 1 ? `mtga/card_${Card.mtga_id}_EN.png` : Card.pict
    }`;
    overlayElements.CardHint.innerHTML = `<img src="${src}"/>`;

    const positioner: {
      // tslint:disable-next-line: deprecation
      pos: ClientRect | DOMRect;
      // tslint:disable-next-line: deprecation
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
      cardPosHeight: cardHeight,
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
        : positioner.pos.bottom - positioner.cardPosHeight > 0
        ? positioner.pos.bottom - positioner.cardPosHeight
        : 0;

    overlayElements.CardHint.style.left = `${
      side === 'me' ? positioner.pos.left + positioner.pos.width : positioner.pos.left - positioner.moPos.width
    }px`;
    overlayElements.CardHint.style.top = `${positioner.hintTop}px`;
    overlayElements.CardHint.classList.remove('hidden');
  });
  theCard.addEventListener('mouseleave', () => {
    overlayElements.CardHint.classList.add('hidden');
  });
};
