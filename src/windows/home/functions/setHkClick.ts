import {showPrompt} from 'root/windows/home/functions/showPrompt';
import {currentCreds, HomePageElements} from 'root/windows/home/home';
import {sendMessageToIpcMain} from 'root/windows/messages';

export function setHkClick(event: Event): void {
  const cl: HTMLElement = event.target as HTMLElement;
  currentCreds.hkBeingSet = cl.getAttribute('data-hk') as string;
  showPrompt('Press ONE button to bind to this function. It will be combination: ALT + [press button]');
}

export function hkSetter(ev: KeyboardEvent): void {
  if (currentCreds.hkBeingSet !== '') {
    const msg = currentCreds.hkBeingSet as
      | 'hk-my-deck'
      | 'hk-opp-deck'
      | 'hk-overlay'
      | 'hk-inc-size'
      | 'hk-dec-size'
      | 'hk-inc-opac'
      | 'hk-dec-opac';
    showPrompt(`Combination ALT + ${ev.key.toUpperCase()} is set`, 1000);
    sendMessageToIpcMain(msg, ev.key);
    currentCreds.hkBeingSet = '';
  }
}
