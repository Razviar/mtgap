import {jsonParse, sumOfObject} from 'root/lib/func';
import {asMap} from 'root/lib/type_utils';
import {colorforfilter, manafont, typecolorletter, cardSuperclass} from 'root/lib/utils';
import {genBattleCardNum} from 'root/windows/overlay/functions/genbattlecardnum';
import {currentMatch, overlayConfig, superclasses} from 'root/windows/overlay/overlay';

export function updateDeck(highlight: number[]): void {
  if (!overlayConfig.metaData) {
    return;
  }
  const meta = overlayConfig.metaData;
  const allcards = overlayConfig.allCards;
  const BasicLand = 34;
  const FirstHandEvals = ['Poor', 'Maybe', 'Good', 'Best'];
  const StepsNumber = 4;
  const FirstHandEvalStep = (currentMatch.myBestFirstCard - currentMatch.myWorstFirstCard) / StepsNumber;

  currentMatch.myFullDeck.forEach((card) => {
    const TheCard = allcards.get(+card.card);
    if (TheCard === undefined) {
      return;
    }
    const mtgaid = TheCard.type === BasicLand ? TheCard.colorindicator : TheCard.mtga_id;
    const crdTxtEl: HTMLElement | null = document.getElementById(`cardnum${mtgaid}me`);
    if (crdTxtEl !== null) {
      crdTxtEl.innerHTML = genBattleCardNum(mtgaid, TheCard.type === BasicLand);
    }
  });
  highlight.forEach((mtgaid) => {
    const cid = meta.mtgatoinnerid[+mtgaid];
    const TheCard = allcards.get(cid);
    if (TheCard === undefined) {
      return;
    }

    const hl = TheCard.type === BasicLand ? TheCard.colorindicator : mtgaid.toString();
    const scls = cardSuperclass(TheCard);
    if (!currentMatch.cardsBySuperclassLeft.has(scls.toString())) {
      currentMatch.cardsBySuperclassLeft.set(scls.toString(), 1);
    } else {
      const n = currentMatch.cardsBySuperclassLeft.get(scls.toString()) as number;
      currentMatch.cardsBySuperclassLeft.set(scls.toString(), n + 1);
    }

    if (TheCard.is_land === 1) {
      const manajMap = asMap(
        TheCard.colorarr !== '' && TheCard.colorarr !== '[]' ? jsonParse(TheCard.colorarr) : undefined
      );

      if (manajMap !== undefined) {
        Object.keys(manajMap).forEach((elem) => {
          if (!currentMatch.landsLeft.has(elem)) {
            currentMatch.landsLeft.set(elem, 1);
          } else {
            const n = currentMatch.landsLeft.get(elem) as number;
            currentMatch.landsLeft.set(elem, n + 1);
          }
          if (+TheCard.type === BasicLand) {
            if (!currentMatch.basicLandsLeft.has(elem)) {
              currentMatch.basicLandsLeft.set(elem, 1);
            } else {
              const n = currentMatch.basicLandsLeft.get(elem) as number;
              currentMatch.basicLandsLeft.set(elem, n + 1);
            }
          }
        });
      }
    }

    const crdEl: HTMLElement | null = document.getElementById(`card${hl}me`);
    if (crdEl) {
      if (currentMatch.TurnNumber === 0) {
        const FirstHandElement: HTMLElement | null = document.getElementById(`FirstHand${mtgaid}`);
        if (FirstHandElement) {
          const positioner =
            Math.ceil((TheCard.wleval_1sthand - currentMatch.myWorstFirstCard) / FirstHandEvalStep) - 1;
          if (positioner > 0 && positioner < FirstHandEvals.length) {
            FirstHandElement.classList.remove('hidden');
            FirstHandElement.classList.add(FirstHandEvals[positioner]);
            FirstHandElement.innerHTML = `${FirstHandElement.innerHTML} (${FirstHandEvals[positioner]})`;
            crdEl.classList.add(`highlightCard${FirstHandEvals[positioner]}`);
          }
        }
      } else {
        crdEl.classList.add('highlightCard');
        setTimeout(() => {
          Array.from(document.getElementsByClassName('highlightCard')).forEach((el) => {
            el.classList.remove('highlightCard');
          });
        }, overlayConfig.highlightTimeout);
      }
    }
  });

  if (currentMatch.TurnNumber !== 0) {
    const FirstHandElements = document.getElementsByClassName('FirstHand');
    const TheDeck = document.getElementsByClassName('DcDrow');
    Array.from(FirstHandElements).forEach((elem) => {
      elem.classList.add('hidden');
    });
    Array.from(TheDeck).forEach((crdEl) => {
      crdEl.classList.remove('highlightCardBest');
      crdEl.classList.remove('highlightCardGood');
      crdEl.classList.remove('highlightCardPoor');
      crdEl.classList.remove('highlightCardWorst');
    });
  }

  for (let scls = 0; scls <= 2; scls++) {
    const sclsEl: HTMLElement | null = document.getElementById(`scls${scls}`);
    if (sclsEl) {
      const cardsBySuperclass = currentMatch.cardsBySuperclass.get(scls.toString());
      const cardsBySuperclassLeft = currentMatch.cardsBySuperclassLeft.get(scls.toString());
      if (cardsBySuperclass !== undefined) {
        const numleft = cardsBySuperclass - (cardsBySuperclassLeft !== undefined ? cardsBySuperclassLeft : 0);
        const cardsPlayed = sumOfObject(currentMatch.decks.me);
        const draw = (100 * (numleft / (currentMatch.totalCards - cardsPlayed))).toFixed(2);
        sclsEl.innerHTML = `<span class="ms ms-${superclasses[scls]}" />${numleft}|${draw}%`;
      }
    }
  }

  for (let cf = 0; cf <= colorforfilter.length - 2; cf++) {
    const clrEl: HTMLElement | null = document.getElementById(`landclr${colorforfilter[cf]}`);
    if (clrEl) {
      const lands = currentMatch.lands.get(colorforfilter[cf]);
      const landsLeft = currentMatch.landsLeft.get(colorforfilter[cf]);
      if (lands !== undefined) {
        const numleft = lands - (landsLeft !== undefined ? landsLeft : 0);
        const cardsPlayed = sumOfObject(currentMatch.decks.me);
        const draw = (100 * (numleft / (currentMatch.totalCards - cardsPlayed))).toFixed(2);
        clrEl.style.display = '';
        clrEl.innerHTML = `<span class="ms ms-${manafont[colorforfilter[cf].toLowerCase()]}" style="color:#${
          typecolorletter[colorforfilter[cf]]
        } !important"></span>${numleft}|${draw}%`;
      } else {
        clrEl.style.display = 'none';
      }
    }
  }
}
