// tslint:disable: no-unsafe-any no-import-side-effect
// tslint:disable: no-magic-numbers
import {Draft} from 'root/models/draft';
import {DeckStrorage, Match} from 'root/models/match';
import {OverlayConfig} from 'root/models/overlay';
import 'root/windows/css.css';
import 'root/windows/keyrune.css';
import 'root/windows/keyrune.woff2';
import 'root/windows/mana.css';
import 'root/windows/mana.woff2';
import {sendMessageToIpcMain} from 'root/windows/messages';
import 'root/windows/NaPecZTIAOhVxoMyOr9n_E7fdM3mDbRS.woff2';
import 'root/windows/NaPecZTIAOhVxoMyOr9n_E7fdMPmDQ.woff2';
import {SetMessages} from 'root/windows/overlay/functions/messages_ipcmain';
import {SetHandlers} from 'root/windows/overlay/functions/sethandlers';
import 'root/windows/overlay/overlay.css';

export const overlayElements = {
  MainOut: document.getElementById('MainOut') as HTMLElement,
  DeckName: document.getElementById('deckName') as HTMLElement,
  MainDeckFrame: document.getElementById('MainDeckFrame') as HTMLElement,
  MoveHandle: document.getElementById('MoveHandle') as HTMLElement,
  OpponentOut: document.getElementById('OpponentOut') as HTMLElement,
  CardHint: document.getElementById('CardHint') as HTMLElement,
  scaleIn: document.getElementById('scaleIn') as HTMLElement,
  scaleOut: document.getElementById('scaleOut') as HTMLElement,
  ToggleOpp: document.getElementById('ToggleOpp') as HTMLElement,
  ToggleMe: document.getElementById('ToggleMe') as HTMLElement,
  OpponentOutFrame: document.getElementById('OpponentOutFrame') as HTMLElement,
  OppMoveHandle: document.getElementById('OppMoveHandle') as HTMLElement,
  TransparencyHandle: document.getElementById('TransparencyHandle') as HTMLElement,
  Collapser: document.getElementById('Collapser') as HTMLElement,
  CollapsibleMenu: document.getElementById('CollapsibleMenu') as HTMLElement,
  LogoSpan: document.getElementById('LogoSpan') as HTMLElement,
  myTimer: document.getElementById('myTimer') as HTMLElement,
  oppTimer: document.getElementById('oppTimer') as HTMLElement,
  OverlayMenu: document.getElementById('OverlayMenu') as HTMLElement,
};

const Interactive = document.getElementsByClassName('Interactive');

export const currentMatch = new Match();
export const currentDraft = new Draft();
export const playerDecks: DeckStrorage = {};
export const userCollection: Map<number, number> = new Map();
export const superclasses = ['sorcery', 'creature', 'land'];
export const overlayConfig: OverlayConfig = {
  ovlSettings: undefined,
  metaData: undefined,
  currentScale: 1,
  currentOpacity: 1,
  dopplerOpacity: -0.1,
  justcreated: true,
  icon: '',
  highlightTimeout: 3000,
};

export const icons: {[index: string]: string} = {'': 'w', '2': 'u', '3': 'b', '1': 'r', '4': 'g'};

export function toggleButtonClass(el: HTMLElement, state: boolean): void {
  el.classList.remove('activeButton');
  if (!state) {
    el.classList.add('activeButton');
  }
}

export function toggler(elem: HTMLElement, totoggle: HTMLElement): void {
  totoggle.addEventListener('click', () => {
    elem.classList.contains('hidden') ? elem.classList.remove('hidden') : elem.classList.add('hidden');
    toggleButtonClass(totoggle, elem.classList.contains('hidden'));
  });
}

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

SetHandlers();
SetMessages();
toggler(overlayElements.OpponentOutFrame, overlayElements.ToggleOpp);
toggler(overlayElements.MainDeckFrame, overlayElements.ToggleMe);
