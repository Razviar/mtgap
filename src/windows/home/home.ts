// tslint:disable: no-any
import {ipcRenderer, shell} from 'electron';

import {tokencheck, tokenrequest, userbytokenid} from 'root/api/userbytokenid';
// tslint:disable: no-import-side-effect
import 'root/windows/home/home.css';
import 'root/windows/home/icons.css';
//import Choices from 'choices.js';

const TokenResponse = document.getElementById('TokenResponse') as HTMLElement;
const TokenInput = document.getElementById('TokenInput') as HTMLElement;
const UserCredentials = document.getElementById('UserCredentials') as HTMLElement;
const StatusMessage = document.getElementById('StatusMessage') as HTMLElement;
const AppVersion = document.getElementById('AppVersion') as HTMLElement;
const minimizeButton = document.getElementById('minimize') as HTMLElement;
const AccountsTab = document.getElementById('accounts') as HTMLElement;
const OverlaySwitch = document.getElementById('OverlaySwitch') as HTMLElement;
const UserControls = document.getElementById('UserControls') as HTMLElement;
const BrightButton = document.getElementById('brightButton') as HTMLElement;
const PromptWnd = document.getElementById('PromptWnd') as HTMLElement;
const PromptText = document.getElementById('PromptText') as HTMLElement;

const buttons = document.getElementsByClassName('button');
const tabs = document.getElementsByClassName('tab');
const controls = document.getElementsByClassName('interfaceButton');
const settings = document.getElementsByClassName('settings');
//const selects = document.getElementsByClassName('interfaceSelect');

//const element = document.querySelector('.js-choice') as HTMLSelectElement;
//const choices = new Choices(element, { searchEnabled: false });

const ShowPrompt = (message: string, autohide: number = 0) => {
  PromptWnd.style.display = 'block';
  PromptText.innerHTML = message;
  if (autohide > 0) {
    setTimeout(() => {
      PromptWnd.style.display = 'none';
    }, autohide);
  }
};

let currentMtgaNick = '';

ipcRenderer.on('set-screenname', (e, arg) => {
  UserCredentials.innerHTML = `MTGA nick: <strong>${arg}</strong>`;
  currentMtgaNick = arg;
});

ipcRenderer.on('set-creds', (e, arg) => {
  //console.log(arg.source);
  const unhide = document.querySelector('[data-button="unskip-acc"]') as HTMLElement;
  if (arg.nick !== 'Skipping') {
    login(arg.token, arg.uid, arg.nick, 'set-creds');
    unhide.classList.add('hidden');
  } else {
    unhide.classList.remove('hidden');
  }
});

ipcRenderer.on('set-settings', (e, arg) => {
  //const setters = ['autorun', 'minimized', 'logpath'];
  if (arg.autorun) {
    const sw = document.querySelector('[data-setting="autorun"]') as HTMLInputElement;
    sw.checked = arg.autorun;
  }

  if (arg.minimized) {
    const sw = document.querySelector('[data-setting="minimized"]') as HTMLInputElement;
    sw.checked = arg.minimized;
  }

  if (arg.manualupdate) {
    const sw = document.querySelector('[data-setting="manualupdate"]') as HTMLInputElement;
    sw.checked = arg.manualupdate;
  }

  if (arg.logpath) {
    const sw = document.getElementById('CurrentLogPath') as HTMLElement;
    sw.innerHTML = `<strong>${arg.logpath}</strong>`;
  } else {
    const sw = document.getElementById('CurrentLogPath') as HTMLElement;
    sw.innerHTML = '<strong>Default</strong>';
  }

  if (arg.icon) {
    const sw = document.querySelector('[data-setting="icon"]') as HTMLSelectElement;
    const opts = sw.options;
    sw.selectedIndex = Array.from(opts).findIndex(opt => opt.value === arg.icon);
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
      <div class='cell'><span class="link" data-link="https://mtgarena.pro/sync/">Unlink</span></div>
      </div>`;
  });
  output += '</div>';
  AccountsTab.innerHTML = output;
  updatelinks();
});

ipcRenderer.on('showprompt', (e, arg) => {
  ShowPrompt(arg.message, arg.autoclose);
});

ipcRenderer.on('new-account', () => {
  //console.log('new-account');
  const unhide = document.querySelector('[data-button="unskip-acc"]') as HTMLElement;
  unhide.classList.add('hidden');
  StatusMessage.innerHTML = 'Awaiting account sync...';
  TokenResponse.innerHTML = '';
  TokenInput.classList.remove('hidden');
  OverlaySwitch.classList.add('hidden');
  UserControls.classList.add('hidden');
});

ipcRenderer.on('show-update-button', () => {
  const sw = document.querySelector('[data-button="apply-update"]') as HTMLElement;
  sw.classList.remove('hidden');
});

minimizeButton.addEventListener('click', () => {
  ipcRenderer.send('minimize-me', 'test');
});

AppVersion.addEventListener('click', () => {
  ipcRenderer.send('check-updates');
});

PromptWnd.addEventListener('click', () => {
  PromptWnd.style.display = 'none';
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
  const button = cl.getAttribute('data-button') as string;
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
    case 'connect-acc':
      cl.innerHTML = 'Awaiting...';
      tokenrequest(currentMtgaNick, AppVersion.innerHTML).then(res => {
        if (res.mode === 'needauth') {
          shell.openExternal(`https://mtgarena.pro/sync/?request=${res.request}`);
          tokenWaiter(res.request);
        } else if (res.mode === 'hasauth') {
          login(res.token, +res.uid, res.nick, 'connect-acc');
        }
      });

      break;
    case 'unskip-acc':
      ipcRenderer.send('kill-current-token');
      break;
    default:
      ipcRenderer.send(button);
      break;
  }
};

const settingsChecker = (event: any) => {
  const cl: HTMLInputElement = event.target;
  const setting = cl.getAttribute('data-setting');
  const data =
    event.target.tagName === 'INPUT'
      ? event.target.checked
      : event.target.tagName === 'SELECT'
      ? event.target.value
      : '';
  //console.log(event.target.tagName);
  ipcRenderer.send('set-setting', {setting, data});
};

const login = (token: string, uid: number, nick: string, source?: string) => {
  //console.log('login!' + token + '/' + nick + '/' + source);

  TokenInput.classList.add('hidden');
  TokenResponse.innerHTML = `Current user: <strong>${nick}</strong>`;
  OverlaySwitch.classList.remove('hidden');
  UserControls.classList.remove('hidden');
  ipcRenderer.send('token-input', {
    token,
    uid,
    nick,
  });

  userbytokenid(token, AppVersion.innerHTML).then(res => {
    if (res.status === 'UNSET_USER') {
      ipcRenderer.send('kill-current-token');
    }
  });

  BrightButton.innerHTML = '<img class="imgico" id="uploadIco" width="20" /> Sync Account';
};

const tokenWaiter = (request: string) => {
  tokencheck(request, AppVersion.innerHTML).then(res => {
    if (res && res.token) {
      login(res.token, res.uid, res.nick);
    } else {
      setTimeout(() => {
        tokenWaiter(request);
      }, 1000);
    }
  });
};

Array.from(buttons).forEach(el => {
  el.addEventListener('click', tabclick);
});

const updatelinks = () => {
  const links = document.getElementsByClassName('link');
  Array.from(links).forEach(el => {
    el.addEventListener('click', linkclick);
  });
};

Array.from(controls).forEach(el => {
  el.addEventListener('click', controlClick);
});

Array.from(settings).forEach(el => {
  el.addEventListener('change', settingsChecker);
});
