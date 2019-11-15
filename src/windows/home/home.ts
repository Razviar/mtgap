// tslint:disable: no-any
import { ipcRenderer, shell } from 'electron';
import { userbytokenid } from 'root/api/userbytokenid';
// tslint:disable: no-import-side-effect
import 'root/windows/home/home.css';
import Icon from 'root/statics/logo_03.png';

const Token: HTMLInputElement | null = document.getElementById(
  'token'
) as HTMLInputElement;
const TokenResponse = document.getElementById('TokenResponse');
const TokenInput = document.getElementById('TokenInput');
const UserCredentials = document.getElementById('UserCredentials');
const StatusMessage = document.getElementById('StatusMessage');
const AppVersion = document.getElementById('AppVersion');
const titleIcon: HTMLImageElement | null = document.getElementById(
  'titleimg'
) as HTMLImageElement;
const minimizeButton = document.getElementById('minimize');
const AccountsTab = document.getElementById('accounts');
const EnableOverlay: HTMLInputElement | null = document.getElementById(
  'EnableOverlay'
) as HTMLInputElement;

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
      EnableOverlay.style.display = '';
      ipcRenderer.send('token-input', {
        token,
        uid: res.data,
        nick: res.status,
      });
    }
  });
};

if (
  Token &&
  TokenInput &&
  TokenResponse &&
  UserCredentials &&
  StatusMessage &&
  AppVersion &&
  minimizeButton &&
  AccountsTab &&
  EnableOverlay
) {
  ipcRenderer.on('set-token', (e, arg) => {
    Token.value = arg;
    TokenInput.style.display = 'none';
    TokenChecker(arg, TokenResponse);
  });

  ipcRenderer.on('set-creds', (e, arg) => {
    UserCredentials.innerHTML = `Linked MTGA nick: <strong>${arg}</strong>`;
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
    <div class='cell'><strong>Nick</strong></div>
    <div class='cell'><strong>MTGA nick</strong></div>
    <div class='cell'><strong>Language</strong></div>
    <div class='cell'><strong>Token</strong></div>
    </div>`;
    Object.keys(arg).forEach(val => {
      const settingsData = arg[val];
      output += `<div class='row'>
      <div class='cell'>${settingsData.nick}</div>
      <div class='cell'>${settingsData.screenName}</div>
      <div class='cell'>${settingsData.language}</div>
      <div class='cell'>${settingsData.token}</div>
      </div>`;
    });
    output += '</div>';
    AccountsTab.innerHTML = output;
  });

  ipcRenderer.on('new-account', (e, arg) => {
    StatusMessage.innerHTML = '';
    TokenResponse.innerHTML = '';
    TokenInput.style.display = '';
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
}

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
