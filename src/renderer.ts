import { ipcRenderer } from 'electron';
import { userbytokenid } from './api/userbytokenid';

const Token: HTMLInputElement | null = document.getElementById(
  'token'
) as HTMLInputElement;
const TokenResponse: HTMLElement | null = document.getElementById(
  'TokenResponse'
);

const TokenChecker = (token: string, elem: HTMLElement) => {
  elem.innerHTML = 'Checking token...';
  userbytokenid(token, 1).then(res => {
    //console.log(res);
    if (res.status === 'BAD_TOKEN') {
      elem.innerHTML = 'Bad Token!';
    } else if (res.status === 'NO_USER') {
      elem.innerHTML = 'No user found!';
    } else {
      elem.innerHTML = `User found: <strong>${res.status}</strong>`;
      ipcRenderer.send('token-input', token);
    }
  });
};

if (Token && TokenResponse) {
  ipcRenderer.on('set-token', (e, arg) => {
    Token.value = arg;
    TokenChecker(arg, TokenResponse);
  });

  // tslint:disable-next-line: no-any
  Token.addEventListener('input', (event: any) => {
    if (event && event.target && event.target.value) {
      TokenChecker(event.target.value, TokenResponse);
    }
  });
}
