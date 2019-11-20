// tslint:disable: no-any
import { ipcRenderer, shell } from 'electron';
import { userbytokenid } from 'root/api/userbytokenid';
// tslint:disable: no-import-side-effect
import 'root/windows/home/home.css';
import Logo from 'root/statics/logo_03.png';
import Generalico from 'root/statics/home.png';
import Settingsico from 'root/statics/settings.png';
import Overlayico from 'root/statics/overlay.png';
import Accountsico from 'root/statics/accounts.png';

const Token: HTMLInputElement | null = document.getElementById('token') as HTMLInputElement;
const EnableOverlay: HTMLInputElement | null = document.getElementById('EnableOverlay') as HTMLInputElement;

const TokenResponse = document.getElementById('TokenResponse') as HTMLElement;
const TokenInput = document.getElementById('TokenInput') as HTMLElement;
const UserCredentials = document.getElementById('UserCredentials') as HTMLElement;
const StatusMessage = document.getElementById('StatusMessage') as HTMLElement;
const AppVersion = document.getElementById('AppVersion') as HTMLElement;
const minimizeButton = document.getElementById('minimize') as HTMLElement;
const AccountsTab = document.getElementById('accounts') as HTMLElement;
const OverlaySwitch = document.getElementById('OverlaySwitch') as HTMLElement;
const UserControls = document.getElementById('UserControls') as HTMLElement;

const titleIcon: HTMLImageElement | null = document.getElementById('titleimg') as HTMLImageElement;
const GeneralIcon: HTMLImageElement | null = document.getElementById('Generalico') as HTMLImageElement;
const SettingsIcon: HTMLImageElement | null = document.getElementById('Settingsico') as HTMLImageElement;
const OverlayIcon: HTMLImageElement | null = document.getElementById('Overlayico') as HTMLImageElement;
const AccountsIcon: HTMLImageElement | null = document.getElementById('Accountsico') as HTMLImageElement;

const buttons = document.getElementsByClassName('button');
const tabs = document.getElementsByClassName('tab');
const links = document.getElementsByClassName('link');
const controls = document.getElementsByClassName('interfaceButton');

titleIcon.src = Logo;
GeneralIcon.src = Generalico;
SettingsIcon.src = Settingsico;
OverlayIcon.src = Overlayico;
AccountsIcon.src = Accountsico;

const TokenChecker = (token: string, elem: HTMLElement) => {
  elem.innerHTML = 'Checking token...';
  userbytokenid(token, 1).then(res => {
    //console.log(res);
    if (res.status === 'BAD_TOKEN') {
      elem.innerHTML = 'Bad Token!';
    } else if (res.status === 'NO_USER') {
      elem.innerHTML = 'No user found!';
    } else {
      TokenInput.classList.add('hidden');
      elem.innerHTML = `Current user: <strong>${res.status}</strong>`;
      OverlaySwitch.classList.remove('hidden');
      UserControls.classList.remove('hidden');
      ipcRenderer.send('token-input', {
        token,
        uid: res.data,
        nick: res.status,
      });
    }
  });
};

ipcRenderer.on('hide-token', () => {
  TokenInput.classList.add('hidden');
});

ipcRenderer.on('set-screenname', (e, arg) => {
  UserCredentials.innerHTML = `MTGA nick: <strong>${arg}</strong>`;
});

ipcRenderer.on('set-creds', (e, arg) => {
  const unhide = document.querySelector('[data-button="unskip-acc"]') as HTMLElement;
  if (arg.nick !== 'Skipping') {
    TokenResponse.innerHTML = `Current user: <strong>${arg.nick}</strong>`;
    OverlaySwitch.classList.remove('hidden');
    UserControls.classList.remove('hidden');
    unhide.classList.add('hidden');
  } else {
    unhide.classList.remove('hidden');
  }
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
    <div class='cell header white'><strong>Nick</strong></div>
    <div class='cell header white'><strong>MTGA nick</strong></div>
    <div class='cell header white'><strong>Language</strong></div>
    <div class='cell header white'><strong>Token</strong></div>
    <div class='cell header white'><strong>Actions</strong></div>
    </div>`;
  Object.keys(arg).forEach(val => {
    const settingsData = arg[val];
    output += `<div class='row'>
      <div class='cell'><strong class="white">${settingsData.nick}</strong></div>
      <div class='cell'>${settingsData.screenName}</div>
      <div class='cell'>${settingsData.language}</div>
      <div class='cell'>${settingsData.token}</div>
      <div class='cell'><span>Skip</span><span>Unlink</span></div>
      </div>`;
  });
  output += '</div>';
  AccountsTab.innerHTML = output;
});

ipcRenderer.on('new-account', () => {
  const unhide = document.querySelector('[data-button="unskip-acc"]') as HTMLElement;
  unhide.classList.add('hidden');
  StatusMessage.innerHTML = 'Awaiting account sync...';
  TokenResponse.innerHTML = '';
  TokenInput.classList.remove('hidden');
  OverlaySwitch.classList.add('hidden');
  UserControls.classList.add('hidden');
  Token.value = '';
});

Token.addEventListener('input', (event: any) => {
  if (event.target && event.target.value && event.target.value !== '') {
    TokenChecker(event.target.value, TokenResponse);
  }
});

minimizeButton.addEventListener('click', () => {
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

const controlClick = (event: any) => {
  const cl: HTMLElement = event.target;
  const button = cl.getAttribute('data-button');
  switch (button) {
    case 'skip-acc':
      TokenInput.classList.add('hidden');
      const unhide = document.querySelector('[data-button="unskip-acc"]') as HTMLElement;
      unhide.classList.remove('hidden');
      ipcRenderer.send('token-input', {
        token: `SKIPPING${Math.floor(1000 * Math.random())}`,
        uid: 0,
        nick: 'Skipping',
      });
      break;
    case 'unskip-acc':
      ipcRenderer.send('kill-current-token');
      break;
  }
};

Array.from(buttons).forEach(el => {
  el.addEventListener('click', tabclick);
});

Array.from(links).forEach(el => {
  el.addEventListener('click', linkclick);
});

Array.from(controls).forEach(el => {
  el.addEventListener('click', controlClick);
});
