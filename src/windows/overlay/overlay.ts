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

const MainOut = document.getElementById('MainOut') as HTMLElement;

const currentMatch = new Match();
const metaData = new MetadataStore(remote.app.getVersion());

const makeCard = (cid: number, num: number): string => {
  const badgesnum = 3;
  const BasicLand = 34;
  if (!metaData.meta) {
    return '';
  }
  const cardsdb = metaData.meta.allcards;

  const name = cardsdb[cid]['name'];
  const rarity = cardsdb[cid]['rarity'];
  const mana = cardsdb[cid]['mana'];
  const kws: string[] = jsonParse(cardsdb[cid]['kw']);
  const scls = supercls[cardsdb[cid]['supercls']];
  const thumb = cardsdb[cid]['art'];
  const colorarr = cardsdb[cid]['colorarr'];
  const island = cardsdb[cid]['is_land'];
  const type = cardsdb[cid]['type'];
  const willbeoutsoon = cardsdb[cid]['willbeoutsoon'];
  const currentstandard = cardsdb[cid]['currentstandard'];
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
        manas += `<span class="ManaGroup${
          sumOfObject(manaj) - (manaj['Colorless'] ? manaj['Colorless'] - 1 : 0) > badgesnum ? ' smallmanagroup' : ''
        } ms ms-${manaj[clr]}"></span>`;
      }
    }
  });

  return `
<div class="DcDrow" id="card${cid}">
<div class="CardSmallPic" style="border-image:${bgcolor}; background:url('https://mtgarena.pro/mtg/pict/thumb/${thumb}') 50% 50%">
</div>
<div class="CNameManaWrap">
<div class="CCmana">
${manas} ${manas !== '' ? '|' : ''} <span class="ms ms-${superclasses[cardsdb[cid]['supercls']]}">
</div>
<div class="CName">${name}</div>
</div>
<div class="Copies" style="color:#${rarcolor[+rarity]}">${num}</div>
</div>`;
};

onMessageFromIpcMain('match-started', newMatch => {
  currentMatch.matchId = newMatch.matchId;
  currentMatch.ourUid = newMatch.uid;
  getlivematch(currentMatch.matchId, currentMatch.ourUid, remote.app.getVersion())
    .then(res => {
      let output = `<div class="deckName">${res.humanname}</div>`;
      res.deckstruct.forEach(card => {
        output += makeCard(card.card, card.cardnum);
      });
      MainOut.innerHTML = output;
      MainOut.classList.remove('hidden');
    })
    // tslint:disable-next-line: no-console
    .catch(console.error);
});

MainOut.addEventListener('mouseenter', () => {
  // tslint:disable-next-line: no-console
  console.log('!!!');
});
