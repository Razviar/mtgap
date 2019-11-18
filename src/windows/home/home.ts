// tslint:disable: no-any
import { ipcRenderer, shell } from 'electron';
import { userbytokenid } from 'root/api/userbytokenid';
// tslint:disable: no-import-side-effect
import 'root/windows/home/home.css';
import Icon from 'root/statics/logo_03.png';

const Token: HTMLInputElement | null = document.getElementById('token') as HTMLInputElement;
const TokenResponse = document.getElementById('TokenResponse') as HTMLElement;
const TokenInput = document.getElementById('TokenInput') as HTMLElement;
const UserCredentials = document.getElementById('UserCredentials') as HTMLElement;
const StatusMessage = document.getElementById('StatusMessage') as HTMLElement;
const AppVersion = document.getElementById('AppVersion') as HTMLElement;
const titleIcon: HTMLImageElement | null = document.getElementById('titleimg') as HTMLImageElement;
const minimizeButton = document.getElementById('minimize') as HTMLElement;
const AccountsTab = document.getElementById('accounts') as HTMLElement;
const OverlaySwitch = document.getElementById('OverlaySwitch') as HTMLElement;
const EnableOverlay: HTMLInputElement | null = document.getElementById('EnableOverlay') as HTMLInputElement;

const buttons = document.getElementsByClassName('button');
const tabs = document.getElementsByClassName('tab');
const links = document.getElementsByClassName('link');

if (titleIcon) {
  titleIcon.src = Icon;
}

const TokenChecker = (token: string, elem: HTMLElement) => {
  elem.innerHTML = 'Checking token...';
  userbytokenid(token, 1).then(res => {
    //console.log(res);
    if (res.status === 'BAD_TOKEN') {
      elem.innerHTML = 'Bad Token!';
    } else if (res.status === 'NO_USER') {
      elem.innerHTML = 'No user found!';
    } else if (TokenInput) {
      TokenInput.style.display = 'none';
      elem.innerHTML = `Current user: <strong>${res.status}</strong>`;
      OverlaySwitch.classList.remove('hidden');
      ipcRenderer.send('token-input', {
        token,
        uid: res.data,
        nick: res.status,
      });
    }
  });
};

ipcRenderer.on('hide-token', (e, arg) => {
  TokenInput.style.display = 'none';
});

ipcRenderer.on('set-creds', (e, arg) => {
  UserCredentials.innerHTML = `Linked MTGA nick: <strong>${arg.screenName}</strong>`;
  TokenResponse.innerHTML = `Current user: <strong>${arg.nick}</strong>`;
  OverlaySwitch.style.display = '';
  OverlaySwitch.classList.remove('hidden');
});

ipcRenderer.on('set-version', (e, arg) => {
  AppVersion.innerHTML = arg;
});

ipcRenderer.on('show-status', (e, arg) => {
  StatusMessage.innerHTML = arg.message;
  StatusMessage.style.color = arg.color;
});

ipcRenderer.on('set-accounts', (e, arg) => {
  let output = `<div class="table"><div class='row'>
    <div class='cell header'><strong>Nick</strong></div>
    <div class='cell header'><strong>MTGA nick</strong></div>
    <div class='cell header'><strong>Language</strong></div>
    <div class='cell header'><strong>Token</strong></div>
    <div class='cell header'><strong>Actions</strong></div>
    </div>`;
  Object.keys(arg).forEach(val => {
    const settingsData = arg[val];
    output += `<div class='row'>
      <div class='cell'>${settingsData.nick}</div>
      <div class='cell'>${settingsData.screenName}</div>
      <div class='cell'>${settingsData.language}</div>
      <div class='cell'>${settingsData.token}</div>
      <div class='cell'></div>
      </div>`;
  });
  output += '</div>';
  AccountsTab.innerHTML = output;
});

ipcRenderer.on('new-account', (e, arg) => {
  StatusMessage.innerHTML = '';
  TokenResponse.innerHTML = '';
  TokenInput.style.display = '';
  OverlaySwitch.classList.add('hidden');
  Token.value = '';
});

Token.addEventListener('input', (event: any) => {
  if (event.target && event.target.value && event.target.value !== '') {
    TokenChecker(event.target.value, TokenResponse);
  }
});

minimizeButton.addEventListener('click', (event: any) => {
  ipcRenderer.send('minimize-me', 'test');
});

EnableOverlay.addEventListener('change', (event: any) => {
  if (event && event.target) {
    ipcRenderer.send('set-overlay', event.target.checked);
  }
});

const tabclick = (event: any) => {
  const cl: HTMLElement = event.target;
  const activate = cl.getAttribute('data-activate');

  Array.from(buttons).forEach(el => {
    const elem = el as HTMLElement;
    const clas = elem.classList;
    if (elem.getAttribute('data-activate') === activate) {
      clas.add('active');
    } else {
      clas.remove('active');
    }
  });

  Array.from(tabs).forEach(el => {
    const elem = el as HTMLElement;
    const clas = elem.classList;
    if (elem.id === activate) {
      clas.add('activetab');
    } else {
      clas.remove('activetab');
    }
  });
};

const linkclick = (event: any) => {
  const cl: HTMLElement = event.target;
  const link = cl.getAttribute('data-link');
  if (link) {
    shell.openExternal(link);
  }
};

Array.from(buttons).forEach(el => {
  el.addEventListener('click', tabclick);
});

Array.from(links).forEach(el => {
  el.addEventListener('click', linkclick);
});
