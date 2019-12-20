import {sendMessageToIpcMain} from 'root/windows/messages';
import {overlayConfig, overlayElements} from 'root/windows/overlay/overlay';

const opacityIncrement = 0.1;
const scaleIncrement = 0.02;

export function SetHandlers(): void {
  overlayElements.TransparencyHandle.addEventListener('click', () => {
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
  });

  overlayElements.scaleIn.addEventListener('click', () => {
    overlayConfig.currentScale += scaleIncrement;
    overlayElements.MainDeckFrame.style.transform = `scale(${overlayConfig.currentScale})`;
    overlayElements.OpponentOutFrame.style.transform = `scale(${overlayConfig.currentScale})`;
    overlayElements.CardHint.style.transform = `scale(${overlayConfig.currentScale})`;
    sendMessageToIpcMain('set-setting-o-savescale', overlayConfig.currentScale);
  });

  overlayElements.scaleOut.addEventListener('click', () => {
    overlayConfig.currentScale -= scaleIncrement;
    overlayElements.MainDeckFrame.style.transform = `scale(${overlayConfig.currentScale})`;
    overlayElements.OpponentOutFrame.style.transform = `scale(${overlayConfig.currentScale})`;
    overlayElements.CardHint.style.transform = `scale(${overlayConfig.currentScale})`;
    sendMessageToIpcMain('set-setting-o-savescale', overlayConfig.currentScale);
  });

  overlayElements.Collapser.addEventListener('click', () => {
    if (overlayElements.Collapser.classList.contains('CollapserIco')) {
      overlayElements.Collapser.classList.remove('CollapserIco');
      overlayElements.Collapser.classList.add('ExpanderIco');
      overlayElements.CollapsibleMenu.classList.add('hidden');
    } else {
      overlayElements.Collapser.classList.remove('ExpanderIco');
      overlayElements.Collapser.classList.add('CollapserIco');
      overlayElements.CollapsibleMenu.classList.remove('hidden');
    }
  });
}
