// tslint:disable: no-any no-unsafe-any no-import-side-effect
import 'pretty-checkbox/dist/pretty-checkbox.min.css';

import {NetworkStatusMessage} from 'root/lib/messages';
import 'root/windows/css.css';
import 'root/windows/fa-brands-400.woff2';
import 'root/windows/fa-regular-400.woff2';
import 'root/windows/fa-solid-900.woff2';
import 'root/windows/fontawesome.css';
import 'root/windows/home/home.css';
import 'root/windows/home/icons.css';
import {onMessageFromIpcMain, sendMessageToIpcMain} from 'root/windows/messages';
import 'root/windows/NaPecZTIAOhVxoMyOr9n_E7fdM3mDbRS.woff2';
import 'root/windows/NaPecZTIAOhVxoMyOr9n_E7fdMPmDQ.woff2';

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
const NetworkStatus = document.getElementById('network-status') as HTMLElement;
const hotkeyMap = document.getElementById('hotkeyMap') as HTMLElement;

const buttons = document.getElementsByClassName('button');
const tabs = document.getElementsByClassName('tab');
const controls = document.getElementsByClassName('controlButton');
const settings = document.getElementsByClassName('settings');
//const selects = document.getElementsByClassName('interfaceSelect');

//const element = document.querySelector('.js-choice') as HTMLSelectElement;
//const choices = new Choices(element, { searchEnabled: false });

const showPrompt = (message: string, autohide: number = 0) => {
  PromptWnd.style.display = 'block';
  PromptText.innerHTML = message;
  if (autohide > 0) {
    setTimeout(() => {
      PromptWnd.style.display = 'none';
    }, autohide);
  }
};

let currentMtgaNick = '';
let currentMtgaID = '';

onMessageFromIpcMain('set-screenname', data => {
  UserCredentials.innerHTML = `MTGA nick: <strong>${data.screenName}</strong>`;
  currentMtgaNick = data.screenName;
  currentMtgaID = data.newPlayerId;
});

onMessageFromIpcMain('set-creds', creds => {
  const unhide = document.querySelector('[data-button="unskip-acc"]') as HTMLElement;
  if (creds.account.nick !== 'Skipping') {
    login(creds.account.token, creds.account.uid, creds.account.nick, 'set-creds');
    unhide.classList.add('hidden');
  } else {
    StatusMessage.innerHTML = 'Skipping this account...';
    UserControls.classList.remove('hidden');
    unhide.classList.remove('hidden');
  }
});

onMessageFromIpcMain('set-o-settings', newOSettings => {
  const overlaySettingsBoolean = [
    'hidezero',
    'showcardicon',
    'hidemy',
    'hideopp',
    'timers',
    'neverhide',
    'mydecks',
    'cardhover',
    'detach',
    'hidemain',
  ];
  const overlaySettingsNumber = [
    'leftdigit',
    'rightdigit',
    'leftdraftdigit',
    'rightdraftdigit',
    'bottomdigit',
    'fontcolor',
  ];

  overlaySettingsBoolean.forEach(setting => {
    const settingType = setting as
      | 'hidezero'
      | 'showcardicon'
      | 'hidemy'
      | 'hideopp'
      | 'timers'
      | 'neverhide'
      | 'mydecks'
      | 'cardhover'
      | 'detach'
      | 'hidemain';

    const sw = document.querySelector(`[data-setting="o-${settingType}"]`) as HTMLInputElement;
    sw.checked = newOSettings[settingType];
  });

  overlaySettingsNumber.forEach(setting => {
    const settingType = setting as
      | 'leftdigit'
      | 'rightdigit'
      | 'bottomdigit'
      | 'rightdraftdigit'
      | 'leftdraftdigit'
      | 'fontcolor';

    const sw = document.querySelector(`[data-setting="o-${settingType}"]`) as HTMLSelectElement;
    const opts = sw.options;
    sw.selectedIndex = Array.from(opts).findIndex(opt => +opt.value === +newOSettings[settingType]);
  });
});

onMessageFromIpcMain('set-settings', newSettings => {
  let output = `<div class="table"><div class='row'>
    <div class='cell header white'><strong>Nick</strong></div>
    <div class='cell header white'><strong>MTGA nick</strong></div>
    <div class='cell header white'><strong>Language</strong></div>
    <div class='cell header white'><strong>Token</strong></div>
    <div class='cell header white'><strong>Actions</strong></div>
    </div>`;
  newSettings.accounts.forEach(account => {
    output += `<div class='row'>
      <div class='cell'><strong class="white">${account.nick}</strong></div>
      <div class='cell'>${account.player ? account.player.screenName : ''}</div>
      <div class='cell'>${account.player ? account.player.language : ''}</div>
      <div class='cell'>${account.token}</div>
      <div class='cell'><span class="link" data-link="https://mtgarena.pro/sync/">Unlink</span></div>
      </div>`;
  });
  output += '</div>';
  AccountsTab.innerHTML = output;
  updatelinks();

  if (newSettings.overlay) {
    const sw = document.querySelector('[data-setting="overlay"]') as HTMLInputElement;
    sw.checked = newSettings.overlay;
  }

  if (newSettings.autorun) {
    const sw = document.querySelector('[data-setting="autorun"]') as HTMLInputElement;
    sw.checked = newSettings.autorun;
  }

  if (newSettings.minimized) {
    const sw = document.querySelector('[data-setting="minimized"]') as HTMLInputElement;
    sw.checked = newSettings.minimized;
  }

  if (newSettings.manualUpdate) {
    const sw = document.querySelector('[data-setting="manualupdate"]') as HTMLInputElement;
    sw.checked = newSettings.manualUpdate;
  }

  if (newSettings.uploads !== undefined) {
    const sw = document.querySelector('[data-setting="do-uploads"]') as HTMLInputElement;
    sw.checked = newSettings.uploads;
  }

  if (newSettings.nohotkeys !== undefined) {
    const sw = document.querySelector('[data-setting="disable-hotkeys"]') as HTMLInputElement;
    sw.checked = newSettings.nohotkeys;
    if (!newSettings.nohotkeys) {
      hotkeyMap.classList.remove('hidden');
    } else {
      hotkeyMap.classList.add('hidden');
    }
  }

  if (newSettings.minimized) {
    const sw = document.querySelector('[data-setting="minimized"]') as HTMLInputElement;
    sw.checked = newSettings.minimized;
  }

  if (newSettings.logPath !== undefined) {
    const sw = document.getElementById('CurrentLogPath') as HTMLElement;
    sw.innerHTML = `<strong>${newSettings.logPath}</strong>`;
  } else {
    const sw = document.getElementById('CurrentLogPath') as HTMLElement;
    sw.innerHTML = '<strong>Default</strong>';
  }

  if (newSettings.mtgaPath !== undefined) {
    const sw = document.getElementById('CurrentMTGAPath') as HTMLElement;
    sw.innerHTML = `<strong>${newSettings.mtgaPath}</strong>`;
  } else {
    const sw = document.getElementById('CurrentMTGAPath') as HTMLElement;
    sw.innerHTML = '<strong class="brown">Unknown!</strong>';
  }

  if (newSettings.icon !== undefined) {
    const sw = document.querySelector('[data-setting="icon"]') as HTMLSelectElement;
    const opts = sw.options;
    sw.selectedIndex = Array.from(opts).findIndex(opt => opt.value === newSettings.icon);
  }
});

onMessageFromIpcMain('set-version', version => {
  AppVersion.innerHTML = version;
});

onMessageFromIpcMain('show-status', arg => {
  if (StatusMessage.innerHTML !== arg.message) {
    StatusMessage.innerHTML = arg.message;
    StatusMessage.style.color = arg.color;
  }
});

onMessageFromIpcMain('show-prompt', arg => {
  showPrompt(arg.message, arg.autoclose);
});

onMessageFromIpcMain('new-account', () => {
  const unhide = document.querySelector('[data-button="unskip-acc"]') as HTMLElement;
  unhide.classList.add('hidden');
  StatusMessage.innerHTML = 'Awaiting account sync...';
  TokenResponse.innerHTML = '';
  TokenInput.classList.remove('hidden');
  OverlaySwitch.classList.add('hidden');
  UserControls.classList.add('hidden');
});

onMessageFromIpcMain('show-update-button', () => {
  const sw = document.querySelector('[data-button="apply-update"]') as HTMLElement;
  sw.classList.remove('hidden');
});

onMessageFromIpcMain('sync-process', res => {
  if (res.mode === 'needauth') {
    sendMessageToIpcMain('open-link', `https://mtgarena.pro/sync/?request=${res.request}`);
    tokenWaiter(res.request);
  } else if (res.mode === 'hasauth') {
    login(res.token, res.uid, res.nick, 'connect-acc');
  }
});

onMessageFromIpcMain('token-waiter-responce', response => {
  if (response.res && response.res.token) {
    login(response.res.token, response.res.uid, response.res.nick);
    sendMessageToIpcMain('do-shadow-sync', undefined);
  } else {
    setTimeout(() => {
      tokenWaiter(response.request);
    }, 1000);
  }
});

onMessageFromIpcMain('userbytokenid-responce', res => {
  if (res.status === 'UNSET_USER') {
    sendMessageToIpcMain('kill-current-token', undefined);
  }
});

onMessageFromIpcMain('shadow-sync-over', () => {
  const ShadowSyncStopper = document.querySelector('[data-button="stop-shadow-sync"]') as HTMLElement;
  ShadowSyncStopper.classList.add('hidden');
  const ShadowSyncStarter = document.querySelector('[data-button="do-shadow-sync""]') as HTMLElement;
  ShadowSyncStarter.classList.remove('hidden');
});

const sss = document.querySelector('[data-button="stop-shadow-sync"]') as HTMLElement;
sss.classList.remove('hidden');

minimizeButton.addEventListener('click', () => {
  sendMessageToIpcMain('minimize-me', undefined);
});

AppVersion.addEventListener('click', () => {
  sendMessageToIpcMain('check-updates', undefined);
});

PromptWnd.addEventListener('click', () => {
  PromptWnd.style.display = 'none';
});

const tabclick = (event: Event) => {
  const cl: HTMLElement = event.target as HTMLElement;
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

const linkclick = (event: Event) => {
  const cl: HTMLElement = event.target as HTMLElement;
  const link = cl.getAttribute('data-link');
  if (link !== null && link.length > 0) {
    sendMessageToIpcMain('open-link', link);
  }
};

const controlClick = (event: Event) => {
  const cl: HTMLElement = event.target as HTMLElement;
  const button = cl.getAttribute('data-button') as string;
  switch (button) {
    case 'skip-acc':
      TokenInput.classList.add('hidden');
      const unhide = document.querySelector('[data-button="unskip-acc"]') as HTMLElement;
      unhide.classList.remove('hidden');
      StatusMessage.innerHTML = 'Skipping this account...';
      UserControls.classList.remove('hidden');
      sendMessageToIpcMain('token-input', {
        token: `SKIPPING${Math.floor(1000 * Math.random())}`,
        uid: '',
        nick: 'Skipping',
        overlay: false,
      });
      break;
    case 'connect-acc':
      cl.innerHTML = 'Awaiting...';
      sendMessageToIpcMain('start-sync', {currentMtgaNick, currentMtgaID});
      break;
    case 'unskip-acc':
      sendMessageToIpcMain('kill-current-token', undefined);
      break;
    case 'do-shadow-sync':
      cl.classList.add('hidden');
      const sssi = document.querySelector('[data-button="stop-shadow-sync"]') as HTMLElement;
      sssi.classList.remove('hidden');
      sendMessageToIpcMain(button, undefined);
      break;
    case 'wipe-all':
    case 'restart-me':
    case 'stop-tracker':
    case 'old-log':
    case 'apply-update':
    case 'set-log-path':
    case 'default-log-path':
    case 'set-mtga-path':
    case 'default-mtga-path':
    case 'stop-shadow-sync':
      sendMessageToIpcMain(button, undefined);
      break;
  }
};

const settingsChecker = (event: Event) => {
  const cl: HTMLInputElement = event.target as HTMLInputElement;
  const setting = cl.getAttribute('data-setting');

  switch (setting) {
    case 'autorun':
      sendMessageToIpcMain('set-setting-autorun', cl.checked);
      break;
    case 'minimized':
      sendMessageToIpcMain('set-setting-minimized', cl.checked);
      break;
    case 'manualupdate':
      sendMessageToIpcMain('set-setting-manualupdate', cl.checked);
      break;
    case 'overlay':
      sendMessageToIpcMain('set-setting-overlay', cl.checked);
      break;
    case 'do-uploads':
      sendMessageToIpcMain('set-setting-do-uploads', cl.checked);
      break;
    case 'disable-hotkeys':
      sendMessageToIpcMain('set-setting-disable-hotkeys', cl.checked);
      if (!cl.checked) {
        hotkeyMap.classList.remove('hidden');
      } else {
        hotkeyMap.classList.add('hidden');
      }
      break;
    case 'icon':
      sendMessageToIpcMain('set-setting-icon', cl.value);
      break;
    case 'o-hidezero':
      sendMessageToIpcMain('set-setting-o-hidezero', cl.checked);
      break;
    case 'o-showcardicon':
      sendMessageToIpcMain('set-setting-o-showcardicon', cl.checked);
      break;
    case 'o-leftdigit':
      sendMessageToIpcMain('set-setting-o-leftdigit', +cl.value);
      break;
    case 'o-rightdigit':
      sendMessageToIpcMain('set-setting-o-rightdigit', +cl.value);
      break;
    case 'o-leftdraftdigit':
      sendMessageToIpcMain('set-setting-o-leftdraftdigit', +cl.value);
      break;
    case 'o-rightdraftdigit':
      sendMessageToIpcMain('set-setting-o-rightdraftdigit', +cl.value);
      break;
    case 'o-bottomdigit':
      sendMessageToIpcMain('set-setting-o-bottomdigit', +cl.value);
      break;
    case 'o-hidemy':
      sendMessageToIpcMain('set-setting-o-hidemy', cl.checked);
      break;
    case 'o-hideopp':
      sendMessageToIpcMain('set-setting-o-hideopp', cl.checked);
      break;
    case 'o-neverhide':
      sendMessageToIpcMain('set-setting-o-neverhide', cl.checked);
      break;
    case 'o-mydecks':
      sendMessageToIpcMain('set-setting-o-mydecks', cl.checked);
      break;
    case 'o-cardhover':
      sendMessageToIpcMain('set-setting-o-cardhover', cl.checked);
      break;
    case 'o-timers':
      sendMessageToIpcMain('set-setting-o-timers', cl.checked);
      break;
    case 'o-fontcolor':
      sendMessageToIpcMain('set-setting-o-fontcolor', +cl.value);
      break;
    case 'o-detach':
      sendMessageToIpcMain('set-setting-o-detach', cl.checked);
      break;
    case 'o-hidemain':
      sendMessageToIpcMain('set-setting-o-hidemain', cl.checked);
      break;
  }
};

const login = (token: string, uid: string, nick: string, source?: string) => {
  TokenInput.classList.add('hidden');
  TokenResponse.innerHTML = `Current user: <strong>${nick}</strong>`;
  StatusMessage.innerHTML = 'Logged in...';
  StatusMessage.style.color = '#22a83a';
  OverlaySwitch.classList.remove('hidden');
  UserControls.classList.remove('hidden');
  sendMessageToIpcMain('token-input', {
    token,
    uid,
    nick,
    overlay: false,
  });

  sendMessageToIpcMain('get-userbytokenid', token);
  BrightButton.innerHTML = '<img class="imgico" id="uploadIco" width="20" /> Sync Account';
};

const tokenWaiter = (request: string) => {
  sendMessageToIpcMain('token-waiter', request);
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

onMessageFromIpcMain('network-status', status => {
  NetworkStatus.title = `${status.message}${
    status.eventsleft !== undefined ? ` (${status.eventsleft} events to upload)` : ''
  }`;
  NetworkStatus.className = getNetworkStatusClassName(status);
});

function getNetworkStatusClassName(status: {active: boolean; message: NetworkStatusMessage}): string {
  if (status.active) {
    if (status.message === NetworkStatusMessage.Connected) {
      return 'network-status-active';
    } else {
      return 'network-status-sending';
    }
  } else {
    return 'network-status-inactive';
  }
}
