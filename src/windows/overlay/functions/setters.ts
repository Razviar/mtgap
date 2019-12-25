import {sendMessageToIpcMain} from 'root/windows/messages';
import {overlayConfig, overlayElements} from 'root/windows/overlay/overlay';

export function scalesetter(save: boolean): void {
  overlayElements.MainDeckFrame.style.transform = `scale(${overlayConfig.currentScale})`;
  overlayElements.OpponentOutFrame.style.transform = `scale(${overlayConfig.currentScale})`;
  overlayElements.CardHint.style.transform = `scale(${overlayConfig.currentScale})`;
  if (save) {
    sendMessageToIpcMain('set-setting-o-savescale', overlayConfig.currentScale);
  }
}

export function opacitySetter(save: boolean): void {
  overlayElements.MainDeckFrame.style.opacity = `${overlayConfig.currentOpacity}`;
  overlayElements.OpponentOutFrame.style.opacity = `${overlayConfig.currentOpacity}`;
  overlayElements.CardHint.style.opacity = `${overlayConfig.currentOpacity}`;
  if (save) {
    sendMessageToIpcMain('set-setting-o-opacity', overlayConfig.currentOpacity);
  }
}
