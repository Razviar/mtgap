// tslint:disable: no-unsafe-any no-import-side-effect
// tslint:disable: no-magic-numbers
import {OverlaySettings} from 'root/app/settings_store';
import {countOfObject, hexToRgbA, jsonParse, sumOfObject} from 'root/lib/func';
import {sortcards} from 'root/lib/sortcards';
import {asMap, asNumber} from 'root/lib/type_utils';
import {color, manafont, typecolorletter} from 'root/lib/utils';
import {Card} from 'root/models/cards';
import {Draft} from 'root/models/draft';
import {DeckStrorage, Match} from 'root/models/match';
import {Metadata} from 'root/models/metadata';
import 'root/windows/css.css';
import 'root/windows/keyrune.css';
import 'root/windows/keyrune.woff2';
import 'root/windows/mana.css';
import 'root/windows/mana.woff2';
import {onMessageFromIpcMain, sendMessageToIpcMain} from 'root/windows/messages';
import 'root/windows/NaPecZTIAOhVxoMyOr9n_E7fdM3mDbRS.woff2';
import 'root/windows/NaPecZTIAOhVxoMyOr9n_E7fdMPmDQ.woff2';
import {dragger} from 'root/windows/overlay/dragger';
import 'root/windows/overlay/overlay.css';

const MainOut = document.getElementById('MainOut') as HTMLElement;
const DeckName = document.getElementById('deckName') as HTMLElement;
const MainDeckFrame = document.getElementById('MainDeckFrame') as HTMLElement;
const MoveHandle = document.getElementById('MoveHandle') as HTMLElement;
const OpponentOut = document.getElementById('OpponentOut') as HTMLElement;
const CardHint = document.getElementById('CardHint') as HTMLElement;
const scaleIn = document.getElementById('scaleIn') as HTMLElement;
const scaleOut = document.getElementById('scaleOut') as HTMLElement;
const ToggleOpp = document.getElementById('ToggleOpp') as HTMLElement;
const ToggleMe = document.getElementById('ToggleMe') as HTMLElement;
const OpponentOutFrame = document.getElementById('OpponentOutFrame') as HTMLElement;
const OppMoveHandle = document.getElementById('OppMoveHandle') as HTMLElement;
const TransparencyHandle = document.getElementById('TransparencyHandle') as HTMLElement;
const Collapser = document.getElementById('Collapser') as HTMLElement;
const CollapsibleMenu = document.getElementById('CollapsibleMenu') as HTMLElement;

const Interactive = document.getElementsByClassName('Interactive');

const highlightTimeout = 3000;

const currentMatch = new Match();
const currentDraft = new Draft();
const playerDecks: DeckStrorage = {};
const userCollection: Map<number, number> = new Map();
let ovlSettings: OverlaySettings | undefined;
let metaData: Metadata | undefined;

const superclasses = ['sorcery', 'creature', 'land'];
let currentScale = 1;
let currentOpacity = 1;
let dopplerOpacity = -0.1;
let justcreated = true;

function toggleButtonClass(el: HTMLElement, state: boolean): void {
  el.classList.remove('activeButton');
  if (!state) {
    el.classList.add('activeButton');
  }
}

function toggler(elem: HTMLElement, totoggle: HTMLElement): void {
  totoggle.addEventListener('click', () => {
    elem.classList.contains('hidden') ? elem.classList.remove('hidden') : elem.classList.add('hidden');
    toggleButtonClass(totoggle, elem.classList.contains('hidden'));
  });
}

function makeCard(cid: number, num: number, side: boolean, draft?: boolean): string {
  if (!metaData) {
    return '';
  }
  const cardsdb = metaData.allcards;
  const inCollection = userCollection.get(cid);
  const name = cardsdb[cid]['name'];
  const mtgaId = cardsdb[cid]['mtga_id'];
  const mana = cardsdb[cid]['mana'];
  const colorarr = cardsdb[cid]['colorarr'];
  const island = cardsdb[cid]['is_land'];
  const supercls = cardsdb[cid]['supercls'];
  const thumb = cardsdb[cid]['art'];
  const drafteval2 = cardsdb[cid]['drafteval2'];
  const wlevalDraft = cardsdb[cid]['wleval_draft'];
  //const battleusageDraft = cardsdb[cid]['battleusage_draft'];
  let bgcolor = 'linear-gradient(to bottom,';
  let clnum = 0;
  let lastcolor = '';

  if (side) {
    currentMatch.totalCards += num;
    if (!currentMatch.cardsBySuperclass.has(supercls.toString())) {
      currentMatch.cardsBySuperclass.set(supercls.toString(), num);
    } else {
      const n = currentMatch.cardsBySuperclass.get(supercls.toString()) as number;
      currentMatch.cardsBySuperclass.set(supercls.toString(), n + num);
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

  let draftOut = '';

  if (draft) {
    const digits: ('leftdraftdigit' | 'rightdraftdigit')[] = ['leftdraftdigit', 'rightdraftdigit'];
    const digitsFilled: Map<string, string> = new Map();
    digits.forEach(digit => {
      if (!ovlSettings) {
        return;
      }
      switch (ovlSettings[digit]) {
        case 1:
          digitsFilled.set(digit, (100 * drafteval2).toFixed(1));
          break;
        case 2:
          digitsFilled.set(digit, (100 * wlevalDraft).toFixed(1));
          break;
        case 3:
          digitsFilled.set(digit, inCollection !== undefined ? inCollection.toString() : '0');
          break;
        case 4:
          digitsFilled.set(digit, '');
          break;
      }
    });

    draftOut = `<div class="uppernum">${
      digitsFilled.get('leftdraftdigit') !== undefined
        ? `<div class="leftuppernum">${digitsFilled.get('leftdraftdigit')}</div>`
        : ''
    } ${digitsFilled.get('rightdraftdigit') !== undefined ? digitsFilled.get('rightdraftdigit') : ''}</div>`;
  }

  return `
<div class="DcDrow" data-cid="${cid}" data-side="${side ? 'me' : 'opp'}" id="card${mtgaId}${side ? 'me' : 'opp'}">
<div class="CardSmallPic${!ovlSettings?.showcardicon ? ' picWithNoPic' : ''}" id="cardthumb${mtgaId}${
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
${draft ? draftOut : num}</div>
</div>`;
}

function updateOppDeck(highlight: number[]): void {
  if (!metaData) {
    return;
  }
  const SortLikeMTGA = 11;
  const meta = metaData;
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

  OpponentOut.innerHTML = output;
  if (!ovlSettings?.hideopp) {
    OpponentOutFrame.classList.remove('hidden');
    toggleButtonClass(ToggleOpp, OpponentOutFrame.classList.contains('hidden'));
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
  }, highlightTimeout);

  const AllCards = document.getElementsByClassName('DcDrow');
  Array.from(AllCards).forEach(theCard => {
    HoverEventListener(theCard);
  });
}

function genBattleCardNum(mtgaid: number): string {
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
  const draw = `${(100 * (numleft / (currentMatch.totalCards - cardsPlayed))).toFixed(2)}%`;

  const digits: ('leftdigit' | 'rightdigit' | 'bottomdigit')[] = ['leftdigit', 'rightdigit', 'bottomdigit'];
  const digitsFilled: Map<string, string> = new Map();
  digits.forEach(digit => {
    if (!ovlSettings) {
      return;
    }
    switch (ovlSettings[digit]) {
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
      crdEl.classList.add(ovlSettings && ovlSettings.hidezero ? 'hidden' : 'outCard');
    }
  }
  return numbers;
}

function updateDeck(highlight: number[]): void {
  if (!metaData) {
    return;
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
      }, highlightTimeout);
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

function drawDraft(): void {
  if (!metaData) {
    return;
  }

  const Sortby = ovlSettings?.leftdraftdigit === 1 ? 2 : ovlSettings?.leftdraftdigit === 2 ? 3 : 11;
  const meta = metaData;
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

  MainOut.innerHTML = output;
  MainDeckFrame.classList.remove('hidden');
  toggleButtonClass(ToggleMe, MainDeckFrame.classList.contains('hidden'));

  const AllCards = document.getElementsByClassName('DcDrow');
  Array.from(AllCards).forEach(theCard => {
    HoverEventListener(theCard);
  });
}

function drawDeck(): void {
  let output = '';
  currentMatch.myFullDeck.forEach(card => {
    output += makeCard(card.card, card.cardnum, true);
  });
  output += '<div class="deckBottom">';
  for (let scls = 0; scls <= 2; scls++) {
    output += `<div id="scls${scls}" class="scls"></div>`;
  }
  output += '</div>';
  DeckName.innerHTML = currentMatch.humanname;
  MainOut.innerHTML = output;
  if (!ovlSettings?.hidemy) {
    MainDeckFrame.classList.remove('hidden');
    toggleButtonClass(ToggleMe, MainDeckFrame.classList.contains('hidden'));
  }
  const AllCards = document.getElementsByClassName('DcDrow');
  Array.from(AllCards).forEach(theCard => {
    HoverEventListener(theCard);
  });
}

const HoverEventListener = (theCard: Element) => {
  const minHeight = 500;
  const imgWidth = 200;

  if (!metaData) {
    return '';
  }
  const cardsdb = metaData.allcards;

  theCard.addEventListener('mouseenter', (event: Event) => {
    if (!ovlSettings?.cardhover) {
      return;
    }

    const cl: HTMLElement = event.target as HTMLElement;
    const cid = cl.getAttribute('data-cid') as string;
    const side = cl.getAttribute('data-side') as string;
    const src = `https://mtgarena.pro/mtg/pict/${
      cardsdb[+cid].has_hiresimg === 1 ? `mtga/card_${cardsdb[+cid].mtga_id}_EN.png` : cardsdb[+cid].pict
    }`;
    CardHint.innerHTML = `<img src="${src}"/>`;

    const positioner: {
      pos: ClientRect | DOMRect;
      moPos: ClientRect | DOMRect;
      cardPosHeight: number;
      maxTop: number;
      hintTop: number;
    } = {
      pos: cl.getBoundingClientRect(),
      moPos: side === 'me' ? MainDeckFrame.getBoundingClientRect() : OpponentOutFrame.getBoundingClientRect(),
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

onMessageFromIpcMain('set-ovlsettings', settings => {
  ovlSettings = settings;
  const smallpics = document.getElementsByClassName('CardSmallPic');
  if (!ovlSettings?.showcardicon) {
    Array.from(smallpics).forEach(pic => {
      pic.classList.add('picWithNoPic');
    });
  } else {
    Array.from(smallpics).forEach(pic => {
      pic.classList.remove('picWithNoPic');
    });
  }

  if (ovlSettings && justcreated) {
    currentScale = ovlSettings.savescale !== 0 ? ovlSettings.savescale : 1;
    MainDeckFrame.style.transform = `scale(${currentScale})`;
    OpponentOutFrame.style.transform = `scale(${currentScale})`;
    CardHint.style.transform = `scale(${currentScale})`;
    if (ovlSettings.savepositionleft !== 0) {
      MainDeckFrame.style.top = `${ovlSettings.savepositiontop}%`;
      MainDeckFrame.style.left = `${ovlSettings.savepositionleft}%`;
    }
    if (ovlSettings.savepositionleftopp !== 0) {
      OpponentOutFrame.style.top = `${ovlSettings.savepositiontopopp}%`;
      OpponentOutFrame.style.left = `${ovlSettings.savepositionleftopp}%`;
    }
    dragger(MainDeckFrame, MoveHandle, currentScale);
    dragger(OpponentOutFrame, OppMoveHandle, currentScale);

    currentOpacity = ovlSettings.opacity !== 0 ? ovlSettings.opacity : 1;
    MainDeckFrame.style.opacity = `${currentOpacity}`;
    OpponentOutFrame.style.opacity = `${currentOpacity}`;
    CardHint.style.opacity = `${currentOpacity}`;
  }

  if (currentDraft.isDrafting) {
    drawDraft();
  }
  if (currentMatch.matchId !== '') {
    updateDeck([]);
  }

  justcreated = false;
});

onMessageFromIpcMain('set-zoom', zoom => {
  sendMessageToIpcMain('set-scale', zoom);
});

onMessageFromIpcMain('set-metadata', meta => {
  metaData = meta;
  //console.log(metaData);
});

onMessageFromIpcMain('set-userdata', umeta => {
  Object.keys(umeta.collection).forEach(col => {
    userCollection.set(+col, umeta.collection[+col].it);
  });

  Object.keys(umeta.coursedecks).forEach(eventName => {
    playerDecks[eventName] = {
      mainDeck: umeta.coursedecks[eventName].deckstruct,
      deckId: umeta.coursedecks[eventName].udeck,
      deckName: umeta.coursedecks[eventName].humanname,
    };
  });
  //console.log(playerDecks);
});

onMessageFromIpcMain('match-started', newMatch => {
  /*console.log('match-started');
  console.log(newMatch.eventId);
  console.log(playerDecks);*/
  if (!Object.keys(playerDecks).includes(newMatch.eventId)) {
    return;
  }
  currentDraft.isDrafting = false;
  MainDeckFrame.classList.add('hidden');
  toggleButtonClass(ToggleMe, MainDeckFrame.classList.contains('hidden'));
  currentMatch.matchId = newMatch.matchId;
  currentMatch.ourUid = newMatch.uid;
  currentMatch.myTeamId = newMatch.seatId;
  currentMatch.eventId = newMatch.eventId;
  currentMatch.GameNumber = newMatch.gameNumber;
  currentMatch.myFullDeck = playerDecks[newMatch.eventId].mainDeck;
  currentMatch.humanname = playerDecks[newMatch.eventId].deckName;
  drawDeck();
  //console.log('match-initiated!');
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

onMessageFromIpcMain('match-over', () => {
  currentMatch.over();
  drawDeck();
  updateOppDeck([]);
  MainDeckFrame.classList.add('hidden');
  toggleButtonClass(ToggleMe, MainDeckFrame.classList.contains('hidden'));
  OpponentOutFrame.classList.add('hidden');
  toggleButtonClass(ToggleOpp, OpponentOutFrame.classList.contains('hidden'));
  CardHint.classList.add('hidden');
});

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

onMessageFromIpcMain('draft-turn', draft => {
  //console.log(draft);
  currentDraft.isDrafting = true;
  currentDraft.draftStep(draft);
  drawDraft();
});

onMessageFromIpcMain('draft-complete', () => {
  //console.log(draft);
  currentDraft.isDrafting = false;
  MainDeckFrame.classList.add('hidden');
  toggleButtonClass(ToggleMe, MainDeckFrame.classList.contains('hidden'));
});

Array.from(Interactive).forEach(elem => {
  elem.addEventListener('mouseleave', (event: Event) => {
    const e = event as MouseEvent;
    if (e.relatedTarget) {
      sendMessageToIpcMain('disable-clicks', undefined);
    }
  });

  elem.addEventListener('mouseenter', () => {
    sendMessageToIpcMain('enable-clicks', undefined);
  });
});

TransparencyHandle.addEventListener('click', () => {
  currentOpacity += dopplerOpacity;
  //console.log(currentOpacity);
  if (currentOpacity.toFixed(1) === '0.5') {
    dopplerOpacity = 0.1;
  } else if (currentOpacity.toFixed(1) === '1.0') {
    dopplerOpacity = -0.1;
  }
  MainDeckFrame.style.opacity = `${currentOpacity}`;
  OpponentOutFrame.style.opacity = `${currentOpacity}`;
  CardHint.style.opacity = `${currentOpacity}`;
  sendMessageToIpcMain('set-setting-o-opacity', currentOpacity);
});

scaleIn.addEventListener('click', () => {
  currentScale += 0.02;
  MainDeckFrame.style.transform = `scale(${currentScale})`;
  OpponentOutFrame.style.transform = `scale(${currentScale})`;
  CardHint.style.transform = `scale(${currentScale})`;
  sendMessageToIpcMain('set-setting-o-savescale', currentScale);
});

scaleOut.addEventListener('click', () => {
  currentScale -= 0.02;
  MainDeckFrame.style.transform = `scale(${currentScale})`;
  OpponentOutFrame.style.transform = `scale(${currentScale})`;
  CardHint.style.transform = `scale(${currentScale})`;
  sendMessageToIpcMain('set-setting-o-savescale', currentScale);
});

Collapser.addEventListener('click', () => {
  if (Collapser.classList.contains('CollapserIco')) {
    Collapser.classList.remove('CollapserIco');
    Collapser.classList.add('ExpanderIco');
    CollapsibleMenu.classList.add('hidden');
  } else {
    Collapser.classList.remove('ExpanderIco');
    Collapser.classList.add('CollapserIco');
    CollapsibleMenu.classList.remove('hidden');
  }
});

toggler(OpponentOutFrame, ToggleOpp);
toggler(MainDeckFrame, ToggleMe);
