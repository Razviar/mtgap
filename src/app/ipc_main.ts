import {App, dialog, nativeImage, shell} from 'electron';
import {join} from 'path';

import {getParsingMetadata} from 'root/api/getindicators';
import {setuserdata, tokencheck, tokenrequest, userbytokenid, UserData} from 'root/api/userbytokenid';
import {loadAppIcon} from 'root/app/app_icon';
import {sendSettingsToRenderer} from 'root/app/auth';
import {disableAutoLauncher, enableAutoLauncher} from 'root/app/auto_launcher';
import {checkForUpdates, quitAndInstall} from 'root/app/auto_updater';
import {parseOldLogs, withLogParser} from 'root/app/log_parser_manager';
import {withHomeWindow} from 'root/app/main_window';
import {onMessageFromBrowserWindow, sendMessageToHomeWindow, sendMessageToOverlayWindow} from 'root/app/messages';
import {withOverlayWindow} from 'root/app/overlay_window';
import {settingsStore} from 'root/app/settings_store';
import {stateStore} from 'root/app/state_store';
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
        newAccount.player = awaiting;

        const userData: UserData = {
          mtgaId: awaiting.playerId,
          mtgaNick: awaiting.screenName,
          language: awaiting.language,
          token: newAccount.token,
        };

        setuserdata(userData).catch(err => {
          error('Failure to set user data after a token-input event', err, {...userData});
        });

        settings.awaiting = undefined;
        withLogParser(logParser => {
          logParser.start().catch(err => {
            error('Failure to start log parser', err);
          });
        });
      }

      // Don't forget to save on disk ;)
      settingsStore.save();
    }
  });

  onMessageFromBrowserWindow('start-sync', currentMtgaCreds => {
    tokenrequest(currentMtgaCreds)
      .then(res => {
        sendMessageToHomeWindow('sync-process', res);
      })
      .catch(err => {
        error('Failure to perform tokenrequest', err, {currentMtgaCreds});
      });
  });

  onMessageFromBrowserWindow('token-waiter', request => {
    tokencheck(request)
      .then(res => {
        sendMessageToHomeWindow('token-waiter-responce', {res, request});
      })
      .catch(err => {
        error('Failure to perform tokencheck', err, {request});
      });
  });

  onMessageFromBrowserWindow('get-userbytokenid', token => {
    userbytokenid(token)
      .then(res => {
        sendMessageToHomeWindow('userbytokenid-responce', res);
      })
      .catch(err => {
        error('Failure to perform userbytokenid', err, {token});
      });
  });

  onMessageFromBrowserWindow('minimize-me', () => withHomeWindow(w => w.hide()));

  onMessageFromBrowserWindow('open-link', link => {
    shell.openExternal(link).catch(err => {
      error('Failure to open link', err, {link});
    });
  });

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
  const overlaySettingsBoolean = [
    'hidezero',
    'showcardicon',
    'hidemy',
    'hideopp',
    'timers',
    'neverhide',
    'mydecks',
    'cardhover',
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
      | 'cardhover';
    const settingName = `set-setting-o-${settingType}` as
      | 'set-setting-o-hidezero'
      | 'set-setting-o-hidemy'
      | 'set-setting-o-hideopp'
      | 'set-setting-o-showcardicon'
      | 'set-setting-o-neverhide'
      | 'set-setting-o-mydecks'
      | 'set-setting-o-cardhover'
      | 'set-setting-o-timers';
    onMessageFromBrowserWindow(settingName, newOverlaySetting => {
      const session = settingsStore.getAccount();
      if (!session) {
        return;
      }
      if (!session.overlaySettings) {
        session.overlaySettings = {
          leftdigit: 2,
          rightdigit: 1,
          bottomdigit: 3,
          leftdraftdigit: 3,
          rightdraftdigit: 1,
          hidemy: false,
          hideopp: false,
          hidezero: false,
          showcardicon: true,
          neverhide: false,
          mydecks: false,
          cardhover: false,
          timers: false,
        };
      }
      session.overlaySettings[settingType] = newOverlaySetting;
      settingsStore.save();
      sendMessageToOverlayWindow('set-ovlsettings', session.overlaySettings);
    });
  });

  const overlaySettingsNumber = ['leftdigit', 'rightdigit', 'bottomdigit', 'leftdraftdigit', 'rightdraftdigit'];

  overlaySettingsNumber.forEach(setting => {
    const settingType = setting as 'leftdigit' | 'rightdigit' | 'bottomdigit' | 'leftdraftdigit' | 'rightdraftdigit';
    const settingName = `set-setting-o-${settingType}` as
      | 'set-setting-o-leftdigit'
      | 'set-setting-o-rightdigit'
      | 'set-setting-o-bottomdigit'
      | 'set-setting-o-leftdraftdigit'
      | 'set-setting-o-rightdraftdigit';
    onMessageFromBrowserWindow(settingName, newOverlaySetting => {
      const session = settingsStore.getAccount();
      if (!session) {
        return;
      }
      if (!session.overlaySettings) {
        session.overlaySettings = {
          leftdigit: 2,
          rightdigit: 1,
          bottomdigit: 3,
          leftdraftdigit: 3,
          rightdraftdigit: 1,
          hidemy: false,
          hideopp: false,
          hidezero: false,
          showcardicon: true,
          neverhide: false,
          mydecks: false,
          cardhover: false,
          timers: false,
        };
      }
      session.overlaySettings[settingType] = newOverlaySetting;
      settingsStore.save();
      sendMessageToOverlayWindow('set-ovlsettings', session.overlaySettings);
    });
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
          sendSettingsToRenderer();
        }
      })
      .catch(err => error('Error while showing open file dialog during set-log-path event', err));
  });

  onMessageFromBrowserWindow('default-log-path', () => {
    settingsStore.get().logPath = undefined;
    settingsStore.save();
    sendMessageToHomeWindow('show-prompt', {message: 'Log path have been set to default!', autoclose: 1000});
    sendSettingsToRenderer();
  });

  const parseOldLogsHandler = (logs: string[], index: number) => {
    sendMessageToHomeWindow('show-prompt', {message: `Parsing old log: ${index + 1}/${logs.length}`, autoclose: 0});
    withLogParser(lp => lp.stop());
    getParsingMetadata(app.getVersion())
      .then(parsingMetadata =>
        parseOldLogs(logs[index], parsingMetadata).then(_ => {
          if (index + 1 === logs.length) {
            sendMessageToHomeWindow('show-prompt', {message: 'Parsing complete!', autoclose: 1000});
            withLogParser(lp => lp.start());
          } else {
            parseOldLogsHandler(logs, index + 1);
          }
        })
      )
      .catch(err => {
        error('Error while parsing old logs', err);
        sendMessageToHomeWindow('show-prompt', {message: 'Error while parsing old logs', autoclose: 1000});
      });
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
          parseOldLogsHandler(log.filePaths, 0);
        }
      })
      .catch(err => error('Error while showing open file dialog during old-log-path event', err));
  });

  onMessageFromBrowserWindow('restart-me', () => {
    sendMessageToHomeWindow('show-prompt', {
      message: 'Restarting tracker...',
      autoclose: 0,
    });
    app.relaunch();
    app.exit();
  });

  onMessageFromBrowserWindow('wipe-all', () => {
    settingsStore.wipe();
    stateStore.wipe();
    sendMessageToHomeWindow('show-prompt', {
      message: 'All settings have been wiped',
      autoclose: 1000,
    });
    app.relaunch();
    app.exit();
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

  onMessageFromBrowserWindow('enable-clicks', () => {
    withOverlayWindow(overlayWindow => {
      overlayWindow.setIgnoreMouseEvents(false);
    });
  });

  onMessageFromBrowserWindow('disable-clicks', () => {
    withOverlayWindow(overlayWindow => {
      overlayWindow.setIgnoreMouseEvents(true, {forward: true});
    });
  });
}
