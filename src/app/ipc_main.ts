import {App, dialog, nativeImage} from 'electron';
import {join} from 'path';

import {setuserdata, UserData} from 'root/api/userbytokenid';
import {loadAppIcon} from 'root/app/app_icon';
import {sendSettingsToRenderer} from 'root/app/auth';
import {disableAutoLauncher, enableAutoLauncher} from 'root/app/auto_launcher';
import {checkForUpdates, quitAndInstall} from 'root/app/auto_updater';
import {createLogParser, getLogParser, withLogParser} from 'root/app/log_parser';
import {withHomeWindow} from 'root/app/main_window';
import {onMessageFromBrowserWindow, sendMessageToHomeWindow} from 'root/app/messages';
import {settingsStore} from 'root/app/settings_store';
import {error} from 'root/lib/logger';

export function setupIpcMain(app: App): void {
  onMessageFromBrowserWindow('token-input', newAccount => {
    const settings = settingsStore.get();
    if (settings.userToken !== newAccount.token) {
      settings.userToken = newAccount.token;
      settingsStore.removeAccount(newAccount.token);
      settings.accounts.push(newAccount);

      const awaiting = settingsStore.get().awaiting;
      if (awaiting) {
        withLogParser(logParser => logParser.setPlayerId(awaiting.playerId, awaiting.screenName));
        newAccount.player = awaiting;

        const userData: UserData = {
          mtgaId: awaiting.playerId,
          mtgaNick: awaiting.screenName,
          language: awaiting.language,
          token: newAccount.token,
        };

        const version = app.getVersion();
        setuserdata(userData, version).catch(err => {
          error('Failure to set user data after a token-input event', err, {...userData, version});
        });

        settings.awaiting = undefined;
      }

      // Don't forget to save on disk ;)
      settingsStore.save();
    }
  });

  onMessageFromBrowserWindow('minimize-me', () => withHomeWindow(w => w.hide()));

  onMessageFromBrowserWindow('set-setting-autorun', newAutorun => {
    const settings = settingsStore.get();
    settings.autorun = newAutorun;
    settingsStore.save();

    if (newAutorun) {
      enableAutoLauncher();
    } else {
      disableAutoLauncher();
    }
  });

  onMessageFromBrowserWindow('set-setting-minimized', newMinimized => {
    const settings = settingsStore.get();
    settings.minimized = newMinimized;
    settingsStore.save();
  });

  onMessageFromBrowserWindow('set-setting-manualupdate', newManualUpdate => {
    const settings = settingsStore.get();
    settings.manualUpdate = newManualUpdate;
    settingsStore.save();
  });

  onMessageFromBrowserWindow('set-setting-overlay', newOverlay => {
    const settings = settingsStore.get();
    settings.overlay = newOverlay;
    settingsStore.save();
  });

  onMessageFromBrowserWindow('set-setting-icon', newIcon => {
    const settings = settingsStore.get();
    settings.icon = newIcon;
    settingsStore.save();

    withHomeWindow(w => {
      const icon = loadAppIcon(newIcon);
      const newico = nativeImage.createFromPath(join(__dirname, icon));
      w.Tray.setImage(newico);
      w.setIcon(newico);
    });
  });

  /*OVERLAY SETTINGS*/

  onMessageFromBrowserWindow('set-setting-o-hidezero', newOverlaySetting => {
    const session = settingsStore.getAccount();
    if (!session) {
      return;
    }
    session.overlaySettings.hidezero = newOverlaySetting;
    settingsStore.save();
  });
  onMessageFromBrowserWindow('set-setting-o-showcardicon', newOverlaySetting => {
    const session = settingsStore.getAccount();
    if (!session) {
      return;
    }
    session.overlaySettings.showcardicon = newOverlaySetting;
    settingsStore.save();
  });
  onMessageFromBrowserWindow('set-setting-o-leftdigit', newOverlaySetting => {
    const session = settingsStore.getAccount();
    if (!session) {
      return;
    }
    session.overlaySettings.leftdigit = newOverlaySetting;
    settingsStore.save();
  });
  onMessageFromBrowserWindow('set-setting-o-rightdigit', newOverlaySetting => {
    const session = settingsStore.getAccount();
    if (!session) {
      return;
    }
    session.overlaySettings.rightdigit = newOverlaySetting;
    settingsStore.save();
  });
  onMessageFromBrowserWindow('set-setting-o-bottomdigit', newOverlaySetting => {
    const session = settingsStore.getAccount();
    if (!session) {
      return;
    }
    session.overlaySettings.bottomdigit = newOverlaySetting;
    settingsStore.save();
  });
  onMessageFromBrowserWindow('set-setting-o-hidemy', newOverlaySetting => {
    const session = settingsStore.getAccount();
    if (!session) {
      return;
    }
    session.overlaySettings.hidemy = newOverlaySetting;
    settingsStore.save();
  });
  onMessageFromBrowserWindow('set-setting-o-hideopp', newOverlaySetting => {
    const session = settingsStore.getAccount();
    if (!session) {
      return;
    }
    session.overlaySettings.hideopp = newOverlaySetting;
    settingsStore.save();
  });

  /*OVERLAY SETTINGS END*/

  onMessageFromBrowserWindow('kill-current-token', () => {
    const settings = settingsStore.get();
    const session = settingsStore.getAccount();
    if (!session) {
      return;
    }

    const player = session.player;
    if (!player) {
      return;
    }

    settings.awaiting = player;
    settings.userToken = undefined;
    settingsStore.removeAccount(session.token);

    settingsStore.save();

    withLogParser(logParser => {
      logParser.stop();
      sendMessageToHomeWindow('new-account', undefined);
    });

    sendSettingsToRenderer();
  });

  onMessageFromBrowserWindow('set-log-path', () => {
    dialog
      .showOpenDialog({properties: ['openFile'], filters: [{name: 'output_*', extensions: ['txt']}]})
      .then(log => {
        if (!log.canceled && log.filePaths[0]) {
          settingsStore.get().logPath = log.filePaths[0];
          settingsStore.save();
          sendMessageToHomeWindow('show-prompt', {message: 'Log path have been updated!', autoclose: 1000});
          withLogParser(logParser => {
            logParser.stop();
            createLogParser();
          });
          sendSettingsToRenderer();
        }
      })
      .catch(err => error('Error while showing open file dialog during set-log-path event', err));
  });

  onMessageFromBrowserWindow('default-log-path', () => {
    settingsStore.get().logPath = undefined;
    settingsStore.save();
    withLogParser(logParser => {
      sendMessageToHomeWindow('show-prompt', {message: 'Log path have been set to default!', autoclose: 1000});
      logParser.stop();
      createLogParser();
    });
    sendSettingsToRenderer();
  });

  const ParseOldLogs = (logs: string[], index: number) => {
    sendMessageToHomeWindow('show-prompt', {
      message: `Parsing old log: ${index + 1}/${logs.length}`,
      autoclose: 0,
    });
    if (getLogParser() !== undefined) {
      const parseOnce = createLogParser(logs[index], true);
      parseOnce.start();
      parseOnce.emitter.on('old-log-complete', () => {
        if (index + 1 === logs.length) {
          sendMessageToHomeWindow('show-prompt', {message: 'Parsing complete!', autoclose: 1000});
        } else {
          ParseOldLogs(logs, index + 1);
        }
      });
    }
  };

  onMessageFromBrowserWindow('old-log', () => {
    dialog
      .showOpenDialog({
        properties: ['openFile', 'multiSelections'],
        defaultPath: 'C:\\Program Files (x86)\\Wizards of the Coast\\MTGA\\MTGA_Data\\Logs\\Logs',
        filters: [{name: 'UTC_Log*', extensions: ['log']}],
      })
      .then(log => {
        if (!log.canceled && log.filePaths[0]) {
          ParseOldLogs(log.filePaths, 0);
        }
      })
      .catch(err => error('Error while showing open file dialog during old-log-path event', err));
  });

  onMessageFromBrowserWindow('wipe-all', () => {
    settingsStore.wipe();
    withLogParser(logParser => {
      sendMessageToHomeWindow('show-prompt', {
        message: 'All settings have been wiped',
        autoclose: 1000,
      });

      logParser.stop();
      logParser = createLogParser();
    });
    sendSettingsToRenderer();
  });

  onMessageFromBrowserWindow('check-updates', () => {
    checkForUpdates();
  });

  onMessageFromBrowserWindow('stop-tracker', () => {
    app.quit();
  });

  onMessageFromBrowserWindow('apply-update', () => {
    quitAndInstall();
  });
}
