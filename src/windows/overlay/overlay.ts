// tslint:disable-next-line: no-import-side-effect
import 'root/windows/overlay/overlay.css';
import { ipcRenderer, remote } from 'electron';
import { Match } from 'root/models/match';
import { getlivematch } from 'root/api/overlay';
import { MetadataStore } from 'root/models/metadata';
import { hexToRgbA, jsonParse, countOfObject, sumOfObject } from 'root/lib/func';
import { manafont, typecolorletter, supercls, rarcolor, color } from 'root/lib/utils';

const MainOut = document.getElementById('MainOut') as HTMLElement;

const currentMatch = new Match();
const metaData = new MetadataStore(remote.app.getVersion());

const makeCard = (cid: number, num: number): string => {
  const badgesnum = 3;
  const BasicLand = 34;
  const meta = metaData.meta;
  if (!meta) {
    return '';
  }
  const cardsdb = meta.allcards;

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
  let bgcolor = 'linear-gradient(to bottom,';

  let clnum = 0;
  let lastcolor = '';

  let manaj: { [index: string]: number } = { '': 0 };

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
              } ms ms-${manafont[clr.toLowerCase()]} ms-cost"
              ></span>`;
        }
      } else {
        manas += `
          <span class="ManaGroup${
            sumOfObject(manaj) - (manaj['Colorless'] ? manaj['Colorless'] - 1 : 0) > badgesnum ? ' smallmanagroup' : ''
          } ms ms-${manaj[clr]} ms-cost"
          ></span>
        `;
      }
    }
  });

  return `<div class="DcDrow" id="card${cid}">
          <div class="CardSmallPic" style="border-image:${bgcolor}; background:url('https://mtgarena.pro/mtg/pict/thumb/${thumb}') 50% 50%">
          </div>
          <div class="Copies" style="color:#${rarcolor[+rarity]}">${num}</div>
          <CName>${name}</CName>
          <div class="CCmana">
            ${manas}
          </div>
        </div>`;
};

ipcRenderer.on('draw-deck', (e, arg) => {});

ipcRenderer.on('match-started', (e, arg) => {
  currentMatch.matchId = arg.matchId;
  currentMatch.ourUid = arg.uid;
  getlivematch(currentMatch.matchId, currentMatch.ourUid, remote.app.getVersion()).then(res => {
    let output = `<div class="deckName">${res.humanname}</div>`;

    //console.log(cards);
    res.deckstruct.forEach(card => {
      output += makeCard(card.card, card.cardnum);
    });
    MainOut.innerHTML = output;
    MainOut.classList.remove('hidden');
  });
});

MainOut.addEventListener('mouseenter', () => {
  console.log('!!!');
});
