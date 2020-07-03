import {HomePageElements} from 'root/windows/home/home';
import {sendMessageToIpcMain} from 'root/windows/messages';

export function settingsChecker(event: Event): void {
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
        HomePageElements.hotkeyMap.classList.remove('hidden');
      } else {
        HomePageElements.hotkeyMap.classList.add('hidden');
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
    case 'o-interactive':
      sendMessageToIpcMain('set-setting-o-interactive', cl.checked);
      break;
  }
}
