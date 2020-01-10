import {manafont, typecolorletter} from 'root/lib/utils';
import {overlayConfig} from 'root/windows/overlay/overlay';

export function makeBasicLand(landClr: string, num: number, side: boolean): string {
  const BasicLandNames: {[index: string]: string} = {
    White: 'Plain',
    Blue: 'Island',
    Black: 'Swamp',
    Red: 'Mountain',
    Green: 'Forest',
  };
  return `
    <div class="DcDrow${
      overlayConfig.ovlSettings?.fontcolor === 2
        ? ' White'
        : overlayConfig.ovlSettings?.fontcolor === 1
        ? ' LightGrey'
        : ' DarkGrey'
    }" data-cid="${landClr}" data-side="${side ? 'me' : 'opp'}" id="card${landClr}${side ? 'me' : 'opp'}">
    <div class="CardSmallPic${
      !overlayConfig.ovlSettings?.showcardicon ? ' picWithNoPic' : ''
    }" id="cardthumb${landClr}${side ? 'me' : 'opp'}" style="background-color:#${
    typecolorletter[landClr]
  }; border-color:#${typecolorletter[landClr]}">
    <span class="ms ms-${manafont[landClr.toLowerCase()]}" style="color:#000"></span>
    </div>
    <div class="CNameManaWrap">
    <div class="CCmana">
    <span class="ms ms-land"></span>
    </div>
    <div class="CName">${BasicLandNames[landClr]}</div>
    </div>
    <div class="Copies" id="cardnum${landClr}${side ? 'me' : 'opp'}">
    ${num}</div>
    </div>`;
}
