import {showPrompt} from 'root/windows/home/functions/showPrompt';
import {currentCreds, HomePageElements} from 'root/windows/home/home';
import {sendMessageToIpcMain} from 'root/windows/messages';

export function gameSwClick(event: Event): void {
  const cl: HTMLElement = event.target as HTMLElement;
  const game: string = cl.id;
  switch (game) {
    case 'runeterra':
      HomePageElements.runelogo.classList.remove('hidden');
      HomePageElements.titleimg.classList.add('hidden');
      HomePageElements.runeterra.classList.add('hidden');
      HomePageElements.mtgapro.classList.remove('hidden');
      HomePageElements.header.classList.remove('mtgaproHeader');
      HomePageElements.header.classList.add('runeterraHeader');
      break;
    case 'mtgapro':
      HomePageElements.runelogo.classList.add('hidden');
      HomePageElements.titleimg.classList.remove('hidden');
      HomePageElements.runeterra.classList.remove('hidden');
      HomePageElements.mtgapro.classList.add('hidden');
      HomePageElements.header.classList.add('mtgaproHeader');
      HomePageElements.header.classList.remove('runeterraHeader');
      break;
  }
}
