import { ipcRenderer } from 'electron';
import { userbytokenid } from './api/userbytokenid';
// tslint:disable-next-line: no-import-side-effect
import './index.css';

const Token: HTMLInputElement | null = document.getElementById(
  'token'
) as HTMLInputElement;
const TokenResponse: HTMLElement | null = document.getElementById(
  'TokenResponse'
);
const UserCredentials: HTMLElement | null = document.getElementById(
  'UserCredentials'
);
const StatusMessage: HTMLElement | null = document.getElementById(
  'StatusMessage'
);
const AppVersion: HTMLElement | null = document.getElementById('AppVersion');

const TokenChecker = (token: string, elem: HTMLElement) => {
  elem.innerHTML = 'Checking token...';
  userbytokenid(token, 1).then(res => {
    //console.log(res);
    if (res.status === 'BAD_TOKEN') {
      elem.innerHTML = 'Bad Token!';
    } else if (res.status === 'NO_USER') {
      elem.innerHTML = 'No user found!';
    } else {
      elem.innerHTML = `Current user: <strong>${res.status}</strong>`;
      ipcRenderer.send('token-input', { token, uid: res.data });
    }
  });
};

if (Token && TokenResponse && UserCredentials && StatusMessage && AppVersion) {
  ipcRenderer.on('set-token', (e, arg) => {
    Token.value = arg;
    TokenChecker(arg, TokenResponse);
  });

  ipcRenderer.on('set-creds', (e, arg) => {
    UserCredentials.innerHTML = `MTGA nick: <strong>${arg}</strong>`;
  });

  ipcRenderer.on('set-version', (e, arg) => {
    AppVersion.innerHTML = arg;
  });

  ipcRenderer.on('show-status', (e, arg) => {
    StatusMessage.innerHTML = arg.message;
    StatusMessage.style.color = arg.color;
  });

  // tslint:disable-next-line: no-any
  Token.addEventListener('input', (event: any) => {
    if (event && event.target && event.target.value) {
      TokenChecker(event.target.value, TokenResponse);
    }
  });
}

const buttons = document.getElementsByClassName('button');
const tabs = document.getElementsByClassName('tab');

const tabclick = (event: any) => {
  const cl: HTMLElement = event.target;
  const activate = cl.getAttribute('data-activate');
  const cls = cl.classList;

  Array.from(buttons).forEach(el => {
    const elem = el as HTMLElement;
    const clas = elem.classList;
    clas.remove('active');
  });

  Array.from(tabs).forEach(el => {
    const elem = el as HTMLElement;
    elem.style.display = 'none';
  });
  if (activate) {
    const show = document.getElementById(activate);
    if (show) {
      show.style.display = 'block';
    }
    cls.add('active');
  }
};

Array.from(buttons).forEach(el => {
  el.addEventListener('click', tabclick);
});
