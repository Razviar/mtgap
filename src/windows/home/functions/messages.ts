import {login} from 'root/windows/home/functions/login';
import {showPrompt} from 'root/windows/home/functions/showPrompt';
import {tokenWaiter} from 'root/windows/home/functions/tokenWaiter';
import {updatelinks} from 'root/windows/home/functions/updatelinks';
import {currentCreds, HomePageElements} from 'root/windows/home/home';
import {onMessageFromIpcMain, sendMessageToIpcMain} from 'root/windows/messages';

export function installHomeMessages(): void {
  onMessageFromIpcMain('set-screenname', data => {
    HomePageElements.UserCredentials.innerHTML = `<div class="stringTitle">MTGA nick:</div><strong>${data.screenName}</strong>`;
    currentCreds.currentMtgaNick = data.screenName;
    currentCreds.currentMtgaID = data.newPlayerId;
  });

  onMessageFromIpcMain('set-hotkey-map', hkMap => {
    if (hkMap === undefined) {
      return;
    }
    Object.keys(hkMap).forEach(key => {
      const btn = key as
        | 'hk-my-deck'
        | 'hk-opp-deck'
        | 'hk-overlay'
        | 'hk-inc-size'
        | 'hk-dec-size'
        | 'hk-inc-opac'
        | 'hk-dec-opac';
      const sw = document.querySelector(`[data-hk="${key}"]`) as HTMLSelectElement;
      sw.innerHTML = hkMap[btn].toUpperCase();
    });
  });

  onMessageFromIpcMain('set-creds', creds => {
    const unhide = document.querySelector('[data-button="unskip-acc"]') as HTMLElement;
    if (creds.account.nick !== 'Skipping') {
      login(creds.account.token, creds.account.uid, creds.account.nick, 'set-creds');
      unhide.classList.add('hidden');
    } else {
      if (creds.account.player !== undefined) {
        currentCreds.currentMtgaNick = creds.account.player.screenName;
        currentCreds.currentMtgaID = creds.account.player.playerId;
        HomePageElements.UserCredentials.innerHTML = `<div class="stringTitle">MTGA nick:</div><strong>${creds.account.player?.screenName}</strong>`;
        HomePageElements.TokenResponse.innerHTML = `<div class="stringTitle">Current user:</div><strong>Skipping this account...</strong>`;
        HomePageElements.StatusMessage.innerHTML = '';
        HomePageElements.UserControls.classList.remove('hidden');
        unhide.classList.remove('hidden');
      }
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
    HomePageElements.AccountsTab.innerHTML = output;
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
        HomePageElements.hotkeyMap.classList.remove('hidden');
      } else {
        HomePageElements.hotkeyMap.classList.add('hidden');
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
    HomePageElements.AppVersion.innerHTML = version;
  });

  onMessageFromIpcMain('show-status', arg => {
    if (HomePageElements.StatusMessage.innerHTML !== arg.message) {
      HomePageElements.StatusMessage.innerHTML = arg.message;
      HomePageElements.StatusMessage.style.color = arg.color;
    }
  });

  onMessageFromIpcMain('show-prompt', arg => {
    showPrompt(arg.message, arg.autoclose);
  });

  onMessageFromIpcMain('new-account', () => {
    const unhide = document.querySelector('[data-button="unskip-acc"]') as HTMLElement;
    unhide.classList.add('hidden');
    HomePageElements.StatusMessage.innerHTML = 'Awaiting account sync...';
    HomePageElements.TokenResponse.innerHTML = '';
    HomePageElements.TokenInput.classList.remove('hidden');
    HomePageElements.OverlaySwitch.classList.add('hidden');
    HomePageElements.UserControls.classList.add('hidden');
    HomePageElements.hotkeyMap.classList.add('hidden');
  });

  onMessageFromIpcMain('show-update-button', () => {
    const sw = document.querySelector('[data-button="apply-update"]') as HTMLElement;
    sw.classList.remove('hidden');
  });

  onMessageFromIpcMain('sync-process', res => {
    if (res.mode === 'needauth') {
      sendMessageToIpcMain('open-link', `https://mtgarena.pro/sync/?request=${res.request}`);
      HomePageElements.directSyncLink.innerHTML = `<div class="directSyncLink">https://mtgarena.pro/sync/?request=${res.request}</div>`;
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
    const ShadowSyncStarter = document.querySelector('[data-button="do-shadow-sync"]') as HTMLElement;
    ShadowSyncStarter.classList.remove('hidden');
  });

  onMessageFromIpcMain('nologfile', () => {
    const unhide = document.querySelector('[data-button="set-log-path"]') as HTMLElement;
    unhide.classList.remove('disabled');
    currentCreds.currentLogState = true;
  });
}
