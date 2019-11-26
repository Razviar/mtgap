import {App, BrowserWindow, Menu, MenuItemConstructorOptions, shell} from 'electron';

import {error} from 'root/lib/logger';

export function createContextMenuForMainWindow(app: App, mainWindow: BrowserWindow): Menu {
  const MenuLinks: MenuItemConstructorOptions[] = [];
  const MenuLabels: {[index: string]: string} = {
    'My Profile': 'https://mtgarena.pro/u/',
    Deckbuilder: 'https://mtgarena.pro/deckbuilder/',
    'Deck Converter': 'https://mtgarena.pro/converter/',
    Decks: 'https://mtgarena.pro/decks/?my',
    Collection: 'https://mtgarena.pro/collection/',
    Progress: 'https://mtgarena.pro/progress/',
    Events: 'https://mtgarena.pro/events/',
    Matches: 'https://mtgarena.pro/matches/',
    Rewards: 'https://mtgarena.pro/rewards/',
    Boosters: 'https://mtgarena.pro/boosters/',
  };

  Object.keys(MenuLabels).forEach(label => {
    MenuLinks.push({
      label,
      click: () => {
        shell
          .openExternal(MenuLabels[label])
          .catch(err =>
            error('Error while opening an external link from the context menu', err, {label, url: MenuLabels[label]})
          );
      },
    });
  });

  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Show Tracker',
      click: () => {
        mainWindow.show();
      },
    },
    {type: 'separator'},
    ...MenuLinks,
    {type: 'separator'},
    {
      label: 'Stop Tracker',
      click: () => {
        app.quit();
      },
    },
  ]);

  return contextMenu;
}
