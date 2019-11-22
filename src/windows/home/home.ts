// tslint:disable: no-any
import { ipcRenderer, shell } from 'electron';
import { tokenrequest, tokencheck, userbytokenid } from 'root/api/userbytokenid';
// tslint:disable: no-import-side-effect
import 'root/windows/home/home.css';

const EnableOverlay = document.getElementById('EnableOverlay') as HTMLInputElement;

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

const buttons = document.getElementsByClassName('button');
const tabs = document.getElementsByClassName('tab');
const links = document.getElementsByClassName('link');
const controls = document.getElementsByClassName('interfaceButton');
const settings = document.getElementsByClassName('settings');

let currentMtgaNick: string = '';

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
  //console.log('new-account');
  const unhide = document.querySelector('[data-button="unskip-acc"]') as HTMLElement;
  unhide.classList.add('hidden');
  StatusMessage.innerHTML = 'Awaiting account sync...';
  TokenResponse.innerHTML = '';
  TokenInput.classList.remove('hidden');
  OverlaySwitch.classList.add('hidden');
  UserControls.classList.add('hidden');
});

minimizeButton.addEventListener('click', () => {
  ipcRenderer.send('minimize-me', 'test');
});

AppVersion.addEventListener('click', () => {
  ipcRenderer.send('check-updates');
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
    case 'connect-acc':
      if (cl.innerHTML !== 'Awaiting...') {
        cl.innerHTML = 'Awaiting...';
        tokenrequest(currentMtgaNick).then(res => {
          if (res.mode === 'needauth') {
            shell.openExternal(`https://mtgarena.pro/sync/?request=${res.request}`);
            tokenWaiter(res.request);
          } else if (res.mode === 'hasauth') {
            login(res.token, +res.uid, res.nick, 'connect-acc');
          }
        });
      }
      break;
    case 'unskip-acc':
      ipcRenderer.send('kill-current-token');
      break;
    case 'set-log-path':
      ipcRenderer.send('set-log-path');
      break;
    case 'stop-tracker':
      ipcRenderer.send('stop-tracker');
      break;
  }
};

const settingsChecker = (event: any) => {
  const cl: HTMLInputElement = event.target;
  const setting = cl.getAttribute('data-setting');
  ipcRenderer.send('set-setting', { setting, data: event.target.checked });
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
  tokencheck(request).then(res => {
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

Array.from(links).forEach(el => {
  el.addEventListener('click', linkclick);
});

Array.from(controls).forEach(el => {
  el.addEventListener('click', controlClick);
});

Array.from(settings).forEach(el => {
  el.addEventListener('change', settingsChecker);
});
