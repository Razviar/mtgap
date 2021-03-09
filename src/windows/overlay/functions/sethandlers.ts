import {sendMessageToIpcMain} from 'root/windows/messages';
import {scalesetter} from 'root/windows/overlay/functions/setters';
import {overlayConfig, overlayElements} from 'root/windows/overlay/overlay';

export const opacityIncrement = 0.1;
export const scaleIncrement = 0.02;

const handlerTransparencyHandle = () => {
  overlayConfig.currentOpacity += overlayConfig.dopplerOpacity;
  //console.log(currentOpacity);
  if (overlayConfig.currentOpacity.toFixed(1) === '0.5') {
    overlayConfig.dopplerOpacity = opacityIncrement;
  } else if (overlayConfig.currentOpacity.toFixed(1) === '1.0') {
    overlayConfig.dopplerOpacity = -1 * opacityIncrement;
  }
  overlayElements.MainDeckFrame.style.opacity = `${overlayConfig.currentOpacity}`;
  overlayElements.OpponentOutFrame.style.opacity = `${overlayConfig.currentOpacity}`;
  overlayElements.CardHint.style.opacity = `${overlayConfig.currentOpacity}`;
  sendMessageToIpcMain('set-setting-o-opacity', overlayConfig.currentOpacity);
};

const handlerscaleIn = () => {
  overlayConfig.currentScale += scaleIncrement;
  scalesetter(true);
};

const handlerscaleOut = () => {
  overlayConfig.currentScale -= scaleIncrement;
  scalesetter(true);
};

const handlerCollapser = () => {
  if (overlayElements.Collapser.classList.contains('CollapserIco')) {
    overlayElements.Collapser.classList.remove('CollapserIco');
    overlayElements.Collapser.classList.add('ExpanderIco');
    overlayElements.CollapsibleMenu.classList.add('hidden');
  } else {
    overlayElements.Collapser.classList.remove('ExpanderIco');
    overlayElements.Collapser.classList.add('CollapserIco');
    overlayElements.CollapsibleMenu.classList.remove('hidden');
  }
};

export function SetHandlers(): void {
  window.onerror = function (error: string | Event, url: string | undefined, line: number | undefined): void {
    sendMessageToIpcMain('error-in-renderer', {error, url, line});
  };

  overlayElements.TransparencyHandle.onclick = handlerTransparencyHandle;
  overlayElements.scaleIn.onclick = handlerscaleIn;
  overlayElements.scaleOut.onclick = handlerscaleOut;
  overlayElements.Collapser.onclick = handlerCollapser;
}
