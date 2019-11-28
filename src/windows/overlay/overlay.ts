// tslint:disable-next-line: no-import-side-effect
import {remote} from 'electron';

import {getlivematch} from 'root/api/overlay';
import {countOfObject, hexToRgbA, jsonParse, sumOfObject} from 'root/lib/func';
import {color, manafont, rarcolor, supercls, typecolorletter} from 'root/lib/utils';
import {Match} from 'root/models/match';
import {MetadataStore} from 'root/models/metadata';
import {onMessageFromIpcMain} from 'root/windows/messages';
// tslint:disable-next-line: no-import-side-effect
import 'root/windows/overlay/overlay.css';
import {Card} from 'root/models/cards';
import {sortcards} from 'root/lib/sortcards';

const MainOut = document.getElementById('MainOut') as HTMLElement;
const OpponentOut = document.getElementById('OpponentOut') as HTMLElement;

const currentMatch = new Match();
const metaData = new MetadataStore(remote.app.getVersion());

const makeCard = (cid: number, num: number, mode: string): string => {
  const badgesnum = 3;
  const BasicLand = 34;
  if (!metaData.meta) {
    return '';
  }
  const cardsdb = metaData.meta.allcards;

  const name = cardsdb[cid]['name'];
  const mtgaId = cardsdb[cid]['mtga_id'];
  const rarity = cardsdb[cid]['rarity'];
  const mana = cardsdb[cid]['mana'];
  const thumb = cardsdb[cid]['art'];
  const colorarr = cardsdb[cid]['colorarr'];
  const island = cardsdb[cid]['is_land'];
  const type = cardsdb[cid]['type'];
  const colorindicator = cardsdb[cid]['colorindicator'];
  const slug = cardsdb[cid]['slug'];
  const flavor = cardsdb[cid]['flavor'];
  const superclasses = ['sorcery', 'creature', 'land'];

  let bgcolor = 'linear-gradient(to bottom,';

  let clnum = 0;
  let lastcolor = '';

  let manaj: {[index: string]: number} = {'': 0};

  if (colorarr !== '' && colorarr !== '[]') {
    manaj = jsonParse(colorarr);
  } else {
    manaj = jsonParse(mana);
  }

  if (manaj) {
    const allcol = countOfObject(manaj);
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

  let manas = '';

  color.forEach(clr => {
    if (manaj && manaj[clr] > 0 && +island === 0) {
      if (clr !== 'Colorless') {
        for (let i = 0; i < manaj[clr]; i++) {
          manas += `
              <span class="ManaGroup${
                sumOfObject(manaj) - (manaj['Colorless'] ? manaj['Colorless'] - 1 : 0) > badgesnum
                  ? ' smallmanagroup'
                  : ''
              } ms ms-${manafont[clr.toLowerCase()]}"
              ></span>`;
        }
      } else {
        manas += `<span class="ManaGroup ms ms-${manaj[clr]}"></span>`;
      }
    }
  });

  return `
<div class="DcDrow" id="card${mtgaId}">
<div class="CardSmallPic" style="border-image:${bgcolor}; background:url('https://mtgarena.pro/mtg/pict/thumb/${thumb}') 50% 50%">
</div>
<div class="CNameManaWrap">
<div class="CCmana">
${manas} ${manas !== '' ? '|' : ''} <span class="ms ms-${superclasses[cardsdb[cid]['supercls']]}">
</div>
<div class="CName">${name}</div>
</div>
<div class="Copies" style="color:#${rarcolor[+rarity]}" id="cardnum${cid}">${num} | ${
    currentMatch.decks.me[mtgaId] > 0 ? num - currentMatch.decks.me[mtgaId] : num
  }</div>
</div>`;
};

const updateOppDeck = (highlight: number[]) => {
  if (!metaData.meta) {
    return '';
  }
  const SortLikeMTGA = 11;
  const meta = metaData.meta;
  let output = '';
  const oppDeck: {[index: number]: number} = {};
  const forsort: {[index: number]: Card} = {};
  /*console.log('???');
  console.log(currentMatch.decks.opponent);*/
  Object.keys(currentMatch.decks.opponent).forEach(OppMtgaCid => {
    //console.log(OppMtgaCid);
    const cid = meta.mtgatoinnerid[+OppMtgaCid];
    oppDeck[+cid] = currentMatch.decks.opponent[+OppMtgaCid];
    forsort[+cid] = meta.allcards[+cid];
  });
  console.log('----');
  console.log(oppDeck);
  sortcards(forsort, true, SortLikeMTGA).forEach(cid => {
    output += makeCard(+cid[0], oppDeck[+cid[0]], 'battle');
  });

  OpponentOut.innerHTML = output;
  OpponentOut.classList.remove('hidden');
};

const updateDeck = (highlight: number[]) => {
  let output = `<div class="deckName">${currentMatch.humanname}</div>`;
  currentMatch.myFullDeck.forEach(card => {
    output += makeCard(card.card, card.cardnum, 'battle');
  });
  MainOut.innerHTML = output;
  MainOut.classList.remove('hidden');

  highlight.forEach(cid => {
    const crdEl: HTMLElement | null = document.getElementById(`card${cid}`);
    if (crdEl) {
      crdEl.classList.add('highlightCard');
    }
  });
  const highlightTimeout = 1500;
  setTimeout(() => {
    Array.from(document.getElementsByClassName('highlightCard')).forEach(el => {
      el.classList.remove('highlightCard');
    });
  }, highlightTimeout);
};

onMessageFromIpcMain('match-started', newMatch => {
  currentMatch.matchId = newMatch.matchId;
  currentMatch.ourUid = newMatch.uid;
  currentMatch.myTeamId = newMatch.seatId;
  currentMatch.GameNumber = newMatch.gameNumber;
  getlivematch(currentMatch.matchId, currentMatch.ourUid, remote.app.getVersion())
    .then(res => {
      currentMatch.myFullDeck = res.deckstruct;
      currentMatch.humanname = res.humanname;
      updateDeck([]);
    })
    // tslint:disable-next-line: no-console
    .catch(console.error);
});

onMessageFromIpcMain('match-over', () => currentMatch.over());

onMessageFromIpcMain('card-played', arg => {
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
