import {HomePageElements} from 'root/windows/home/home';
import {sendMessageToIpcMain} from 'root/windows/messages';

export function login(token: string, uid: string, nick: string, source?: string): void {
  HomePageElements.TokenInput.classList.add('hidden');
  HomePageElements.TokenResponse.innerHTML = `Current user: <strong>${nick}</strong>`;
  HomePageElements.StatusMessage.innerHTML = 'Logged in...';
  HomePageElements.StatusMessage.style.color = '#22a83a';
  HomePageElements.OverlaySwitch.classList.remove('hidden');
  HomePageElements.UserControls.classList.remove('hidden');
  sendMessageToIpcMain('token-input', {
    token,
    uid,
    nick,
    overlay: false,
  });
  sendMessageToIpcMain('get-userbytokenid', token);
  HomePageElements.BrightButton.innerHTML = '<img class="imgico" id="uploadIco" width="20" /> Sync Account';
}
