// tslint:disable: no-unsafe-any no-import-side-effect
import {countOfObject, hexToRgbA, jsonParse, sumOfObject} from 'root/lib/func';
import {sortcards} from 'root/lib/sortcards';
import {asMap, asNumber} from 'root/lib/type_utils';
import {color, manafont, typecolorletter} from 'root/lib/utils';
import {Card} from 'root/models/cards';
import {DeckStrorage, Match} from 'root/models/match';
import {Metadata} from 'root/models/metadata';
import 'root/windows/css.css';
import {onMessageFromIpcMain} from 'root/windows/messages';
import 'root/windows/NaPecZTIAOhVxoMyOr9n_E7fdM3mDbRS.woff2';
import 'root/windows/NaPecZTIAOhVxoMyOr9n_E7fdMPmDQ.woff2';
import 'root/windows/overlay/keyrune.css';
import 'root/windows/overlay/keyrune.woff2';
import 'root/windows/overlay/mana.css';
import 'root/windows/overlay/mana.woff2';
import 'root/windows/overlay/overlay.css';

const MainOut = document.getElementById('MainOut') as HTMLElement;
const OpponentOut = document.getElementById('OpponentOut') as HTMLElement;
const CardHint = document.getElementById('CardHint') as HTMLElement;
const highlightTimeout = 3000;

const currentMatch = new Match();
const playerDecks: DeckStrorage = {};
let metaData: Metadata | undefined;
const superclasses = ['sorcery', 'creature', 'land'];

function makeCard(cid: number, num: number, side: boolean): string {
  if (!metaData) {
    return '';
  }
  const cardsdb = metaData.allcards;

  const name = cardsdb[cid]['name'];
  const mtgaId = cardsdb[cid]['mtga_id'];
  const mana = cardsdb[cid]['mana'];
  const colorarr = cardsdb[cid]['colorarr'];
  const island = cardsdb[cid]['is_land'];
  const supercls = cardsdb[cid]['supercls'];
  const thumb = cardsdb[cid]['art'];
  let bgcolor = 'linear-gradient(to bottom,';
  let clnum = 0;
  let lastcolor = '';

  if (side) {
    currentMatch.totalCards += num;
    if (currentMatch.cardsBySuperclass[supercls] === 0) {
      currentMatch.cardsBySuperclass[supercls] = num;
    } else {
      currentMatch.cardsBySuperclass[supercls] += num;
    }
  }

  const manajMap = asMap(colorarr !== '' && colorarr !== '[]' ? jsonParse(colorarr) : jsonParse(mana));
  const manaj: {[index: string]: number} = {};
  if (manajMap !== undefined) {
    Object.keys(manajMap).forEach(elem => {
      manaj[elem] = asNumber(manajMap[elem], 0);
    });
  }

  let manas = '';

  const allcol = countOfObject(manaj);
  if (allcol > 0) {
    Object.keys(manaj).forEach((clr: string) => {
      if (clr !== 'Colorless' || +allcol === 0) {
        if (clr.indexOf('/') === -1) {
          if (manafont[clr.toLowerCase()] !== '') {
            bgcolor += (bgcolor !== 'linear-gradient(to bottom,' ? ',' : '') + hexToRgbA(`#${typecolorletter[clr]}`);
            lastcolor = hexToRgbA(`#${typecolorletter[clr]}`);
            clnum++;
          } else {
            const splitclrs: string[] = clr.split('/');
            splitclrs.forEach(cl => {
              bgcolor += (bgcolor !== 'linear-gradient(to bottom,' ? ',' : '') + hexToRgbA(`#${typecolorletter[cl]}`);
              lastcolor = hexToRgbA(`#${typecolorletter[cl]}`);
              clnum++;
            });
          }
        }
      } else if (clr === 'Colorless' && +sumOfObject(manaj) === +manaj['Colorless']) {
        bgcolor += `${hexToRgbA('#ababab')},${hexToRgbA('#ababab')}`;
      }
    });

    if (clnum === 1) {
      bgcolor += (bgcolor !== 'linear-gradient(to bottom,' ? ',' : '') + lastcolor;
    }
  } else {
    bgcolor += (bgcolor !== 'linear-gradient(to bottom,' ? ',' : '') + hexToRgbA(`#${typecolorletter.Colorless}`);
    lastcolor = hexToRgbA(`#${typecolorletter.Colorless}`);
    clnum++;
  }
  bgcolor += ') 1 100%';

  color.forEach(clr => {
    // tslint:disable-next-line: strict-boolean-expressions
    if (manaj && manaj[clr] > 0 && +island === 0) {
      if (clr !== 'Colorless') {
        for (let i = 0; i < manaj[clr]; i++) {
          manas += `
              <span class="ManaGroup ms ms-${manafont[clr.toLowerCase()]}"
              ></span>`;
        }
      } else {
        manas += `<span class="ManaGroup ms ms-${manaj[clr]}"></span>`;
      }
    }
  });

  return `
<div class="DcDrow" data-cid="${cid}" data-side="${side ? 'me' : 'opp'}" id="card${mtgaId}${side ? 'me' : 'opp'}">
<div class="CardSmallPic" id="cardthumb${mtgaId}${
    side ? 'me' : 'opp'
  }" style="background:url('https://mtgarena.pro/mtg/pict/thumb/${thumb}') 50% 50%; border-image:${bgcolor}">
</div>
<div class="CNameManaWrap">
<div class="CCmana">
${manas} ${manas !== '' ? '|' : ''} <span class="ms ms-${superclasses[cardsdb[cid]['supercls']]}">
</div>
<div class="CName">${name}</div>
</div>
<div class="Copies" id="cardnum${mtgaId}${side ? 'me' : 'opp'}">
${side ? `${num} | ${num}` : num}</div>
</div>`;
}

const updateOppDeck = (highlight: number[]) => {
  if (!metaData) {
    return '';
  }
  const SortLikeMTGA = 11;
  const meta = metaData;
  const oppDeck: {[index: number]: number} = {};
  const forsort: {[index: number]: Card} = {};

  Object.keys(currentMatch.decks.opponent).forEach(OppMtgaCid => {
    const cid = meta.mtgatoinnerid[+OppMtgaCid];
    oppDeck[+cid] = currentMatch.decks.opponent[+OppMtgaCid];
    forsort[+cid] = meta.allcards[+cid];
  });
  let output = '';
  sortcards(forsort, true, SortLikeMTGA).forEach(cid => {
    output += makeCard(+cid[0], oppDeck[+cid[0]], false);
  });

  OpponentOut.innerHTML = output;
  OpponentOut.classList.remove('hidden');

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
  }, highlightTimeout);

  const AllCards = document.getElementsByClassName('DcDrow');
  Array.from(AllCards).forEach(theCard => {
    HoverEventListener(theCard);
  });
};

const genBattleCardNum = (mtgaid: number) => {
  /*console.log(currentMatch.totalCards);
  console.log(currentMatch.cardsBySuperclass);*/

  if (!metaData) {
    return '';
  }

  const cid = metaData.mtgatoinnerid[+mtgaid];
  const num = currentMatch.myFullDeck.find(fd => fd.card === +cid);
  if (!num) {
    return '';
  }

  const numleft = currentMatch.decks.me[+mtgaid] > 0 ? num.cardnum - currentMatch.decks.me[+mtgaid] : num.cardnum;
  const cardsPlayed = sumOfObject(currentMatch.decks.me);
  const draw = (100 * (numleft / (currentMatch.totalCards - cardsPlayed))).toFixed(2);
  //console.log(numleft + '/' + currentMatch.totalCards + '/' + cardsPlayed);
  const numbers = `<div class="uppernum"><div class="leftuppernum">${num.cardnum}</div> ${numleft}</div><div class="bottomnum">${draw}%</div>`;
  if (numleft === 0) {
    const crdEl: HTMLElement | null = document.getElementById(`card${mtgaid}me`);
    if (crdEl) {
      crdEl.classList.add('outCard');
    }
  }
  return numbers;
};

const updateDeck = (highlight: number[]) => {
  if (!metaData) {
    return '';
  }
  const meta = metaData;

  currentMatch.myFullDeck.forEach(card => {
    const mtgaid = meta.allcards[+card.card].mtga_id;
    const crdTxtEl: HTMLElement | null = document.getElementById(`cardnum${mtgaid}me`);
    if (crdTxtEl !== null) {
      crdTxtEl.innerHTML = genBattleCardNum(mtgaid);
    }
  });
  highlight.forEach(mtgaid => {
    const cid = meta.mtgatoinnerid[+mtgaid];
    const scls = meta.allcards[+cid].supercls;
    if (currentMatch.cardsBySuperclassLeft[scls] === 0) {
      currentMatch.cardsBySuperclassLeft[scls] = 1;
    } else {
      currentMatch.cardsBySuperclassLeft[scls]++;
    }

    const crdEl: HTMLElement | null = document.getElementById(`card${mtgaid}me`);
    if (crdEl) {
      crdEl.classList.add('highlightCard');
      setTimeout(() => {
        Array.from(document.getElementsByClassName('highlightCard')).forEach(el => {
          el.classList.remove('highlightCard');
        });
      }, highlightTimeout);
    }
  });

  for (let scls = 0; scls <= 2; scls++) {
    const sclsEl: HTMLElement | null = document.getElementById(`scls${scls}`);
    if (sclsEl) {
      const numleft = currentMatch.cardsBySuperclass[scls] - currentMatch.cardsBySuperclassLeft[scls];
      const cardsPlayed = sumOfObject(currentMatch.decks.me);
      const draw = (100 * (numleft / (currentMatch.totalCards - cardsPlayed))).toFixed(2);
      sclsEl.innerHTML = `<span class="ms ms-${superclasses[scls]}"> ${numleft} | ${draw}%`;
    }
  }
};

const drawDeck = () => {
  let output = `<div class="deckName">${currentMatch.humanname}</div>`;
  currentMatch.myFullDeck.forEach(card => {
    output += makeCard(card.card, card.cardnum, true);
  });
  output += '<div class="deckBottom">';
  for (let scls = 0; scls <= 2; scls++) {
    output += `<div id="scls${scls}" class="scls"></div>`;
  }
  output += '</div>';
  MainOut.innerHTML = output;
  MainOut.classList.remove('hidden');

  const AllCards = document.getElementsByClassName('DcDrow');
  Array.from(AllCards).forEach(theCard => {
    HoverEventListener(theCard);
  });
};

const HoverEventListener = (theCard: Element) => {
  const minHeight = 500;
  const imgWidth = 200;

  if (!metaData) {
    return '';
  }
  const cardsdb = metaData.allcards;

  theCard.addEventListener('mouseenter', (event: Event) => {
    const cl: HTMLElement = event.target as HTMLElement;
    const cid = cl.getAttribute('data-cid') as string;
    const side = cl.getAttribute('data-side') as string;
    const src = `https://mtgarena.pro/mtg/pict/${
      cardsdb[+cid].has_hiresimg === 1 ? `mtga/card_${cardsdb[+cid].mtga_id}_EN.png` : cardsdb[+cid].pict
    }`;
    CardHint.innerHTML = `<img src="${src}" class="CardClass" />`;

    const positioner: {
      pos: ClientRect | DOMRect;
      moPos: ClientRect | DOMRect;
      cardPosHeight: number;
      maxTop: number;
      hintTop: number;
    } = {
      pos: cl.getBoundingClientRect(),
      moPos: side === 'me' ? MainOut.getBoundingClientRect() : OpponentOut.getBoundingClientRect(),
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

    CardHint.style.left = `${
      side === 'me' ? positioner.pos.left + positioner.pos.width : positioner.pos.left - imgWidth
    }px`;
    CardHint.style.top = `${positioner.hintTop}px`;
    CardHint.classList.remove('hidden');
  });
  theCard.addEventListener('mouseleave', () => {
    CardHint.classList.add('hidden');
  });
};

onMessageFromIpcMain('set-metadata', meta => {
  console.log(meta);
  metaData = meta;
});

onMessageFromIpcMain('set-userdata', umeta => {
  console.log(umeta);
  Object.keys(umeta.coursedecks).forEach(eventName => {
    playerDecks[eventName] = {
      mainDeck: umeta.coursedecks[eventName].deckstruct,
      deckId: umeta.coursedecks[eventName].udeck,
      deckName: umeta.coursedecks[eventName].humanname,
    };
  });
});

onMessageFromIpcMain('match-started', newMatch => {
  if (!Object.keys(playerDecks).includes(newMatch.eventId)) {
    return;
  }
  currentMatch.matchId = newMatch.matchId;
  currentMatch.ourUid = newMatch.uid;
  currentMatch.myTeamId = newMatch.seatId;
  currentMatch.eventId = newMatch.eventId;
  currentMatch.GameNumber = newMatch.gameNumber;
  currentMatch.myFullDeck = playerDecks[newMatch.eventId].mainDeck;
  currentMatch.humanname = playerDecks[newMatch.eventId].deckName;
  drawDeck();
});

onMessageFromIpcMain('deck-submission', deck => {
  if (!metaData) {
    return '';
  }
  if (!Object.keys(playerDecks).includes(deck.InternalEventName)) {
    playerDecks[deck.InternalEventName] = {mainDeck: [], deckId: deck.deckId, deckName: deck.deckName};
  } else {
    playerDecks[deck.InternalEventName].mainDeck = [];
    playerDecks[deck.InternalEventName].deckId = deck.deckId;
    playerDecks[deck.InternalEventName].deckName = deck.deckName;
  }

  const SortLikeMTGA = 11;
  const meta = metaData;
  const theDeck: {[index: number]: number} = {};
  const forsort: {[index: number]: Card} = {};

  Object.keys(deck.mainDeck).forEach(MtgaCid => {
    const cid = meta.mtgatoinnerid[+MtgaCid];
    theDeck[+cid] = deck.mainDeck[+MtgaCid];
    forsort[+cid] = meta.allcards[+cid];
  });
  sortcards(forsort, true, SortLikeMTGA).forEach(cid => {
    playerDecks[deck.InternalEventName].mainDeck.push({card: +cid[0], cardnum: theDeck[+cid[0]]});
  });
});

onMessageFromIpcMain('mulligan', res => {
  if (res) {
    currentMatch.mulligan();
    const AllCards = document.getElementsByClassName('DcDrow');
    Array.from(AllCards).forEach(theCard => theCard.classList.remove('outCard'));
    updateDeck([]);
  }
});

onMessageFromIpcMain('match-over', () => currentMatch.over());

onMessageFromIpcMain('card-played', arg => {
  //console.log(arg);
  const res = currentMatch.cardplayed({
    grpId: arg.grpId,
    instanceId: arg.instanceId,
    ownerSeatId: arg.ownerSeatId,
    zoneId: arg.zoneId,
  });
  if (res.myDeck) {
    if (res.affectedcards.length > 0) {
      updateDeck(res.affectedcards);
    }
  } else {
    updateOppDeck(res.affectedcards);
  }
});

MainOut.addEventListener('mouseenter', () => {
  // tslint:disable-next-line: no-console
  console.log('!!!');
});
