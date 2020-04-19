import {HomePageElements} from 'root/windows/home/home';
import {sendMessageToIpcMain} from 'root/windows/messages';

export function gameSwClick(event: Event): void {
  const cl: HTMLElement = event.target as HTMLElement;
  const game: string = cl.id;
  HomePageElements.UserCredentials.innerHTML = '';
  HomePageElements.TokenResponse.innerHTML = '';
  HomePageElements.StatusMessage.innerHTML = '';
  switch (game) {
    case 'runeterra':
      activateGame('lor');
      sendMessageToIpcMain('game-switch', 'lor');
      break;
    case 'mtgapro':
      activateGame('mtga');
      sendMessageToIpcMain('game-switch', 'mtga');
      break;
  }
}

export function activateGame(game: string): void {
  switch (game) {
    case 'lor':
      HomePageElements.runelogo.classList.remove('hidden');
      HomePageElements.mtgapro.classList.remove('hidden');
      HomePageElements.header.classList.remove('mtgaproHeader');
      HomePageElements.titleimg.classList.add('hidden');
      HomePageElements.runeterra.classList.add('hidden');
      HomePageElements.header.classList.add('runeterraHeader');

      Array.from(HomePageElements.MtgaTab).forEach((el) => {
        el.classList.add('hidden');
      });

      Array.from(HomePageElements.LorTab).forEach((el) => {
        el.classList.remove('hidden');
      });
      break;
    case 'mtga':
      HomePageElements.runelogo.classList.add('hidden');
      HomePageElements.mtgapro.classList.add('hidden');
      HomePageElements.header.classList.add('mtgaproHeader');
      HomePageElements.titleimg.classList.remove('hidden');
      HomePageElements.runeterra.classList.remove('hidden');
      HomePageElements.header.classList.remove('runeterraHeader');

      Array.from(HomePageElements.MtgaTab).forEach((el) => {
        el.classList.remove('hidden');
      });

      Array.from(HomePageElements.LorTab).forEach((el) => {
        el.classList.add('hidden');
      });
      break;
  }
}
