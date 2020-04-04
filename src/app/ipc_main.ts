import {App, dialog, nativeImage, shell} from 'electron';
import {join} from 'path';

import {setuserdata, tokencheck, tokenrequest, userbytokenid, UserData} from 'root/api/userbytokenid';
import {loadAppIcon} from 'root/app/app_icon';
import {sendSettingsToRenderer} from 'root/app/auth';
import {disableAutoLauncher, enableAutoLauncher} from 'root/app/auto_launcher';
import {checkForUpdates, quitAndInstall} from 'root/app/auto_updater';
import {unRegisterHotkeys} from 'root/app/hotkeys';
import {withLogParser} from 'root/app/log_parser_manager';
import {withHomeWindow} from 'root/app/main_window';
import {onMessageFromBrowserWindow, sendMessageToHomeWindow, sendMessageToOverlayWindow} from 'root/app/messages';
import {locateMtgaDir, ShadowLogParse} from 'root/app/mtga_dir_ops';
import {oldLogHandlerStatus, parseOldLogsHandler} from 'root/app/old-log-handler';
import {withOverlayWindow} from 'root/app/overlay_window';
import {settingsStore} from 'root/app/settings-store/settings_store';
import {stateStore} from 'root/app/state_store';
import {error} from 'root/lib/logger';

export function setupIpcMain(app: App): void {
  onMessageFromBrowserWindow('token-input', (newAccount) => {
    const settings = settingsStore.get();
    const game: 'lor' | 'mtga' = newAccount.game;
    if (!settings.userToken || settings.userToken[game] !== newAccount.token) {
      if (settings.userToken === undefined) {
        settings.userToken = {};
      }
      settings.userToken[game] = newAccount.token;

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

        if (!newAccount.token.includes('SKIPPING')) {
          setuserdata(userData).catch((err) => {
            error('Failure to set user data after a token-input event', err, {...userData});
          });
        }

        settings.awaiting = undefined;
        withLogParser((logParser) => {
          logParser.start().catch((err) => {
            error('Failure to start log parser', err);
          });
        });
      }

      // Don't forget to save on disk ;)
      settingsStore.save();
    }
    sendSettingsToRenderer();
  });

  onMessageFromBrowserWindow('start-sync', (currentMtgaCreds) => {
    tokenrequest(currentMtgaCreds)
      .then((res) => {
        sendMessageToHomeWindow('sync-process', res);
      })
      .catch((err) => {
        error('Failure to perform tokenrequest', err, {currentMtgaCreds});
      });
  });

  onMessageFromBrowserWindow('token-waiter', (request) => {
    tokencheck(request)
      .then((res) => {
        sendMessageToHomeWindow('token-waiter-responce', {res, request});
      })
      .catch((err) => {
        error('Failure to perform tokencheck', err, {request}, true);
      });
  });

  onMessageFromBrowserWindow('get-userbytokenid', (token) => {
    userbytokenid(token)
      .then((res) => {
        sendMessageToHomeWindow('userbytokenid-responce', res);
      })
      .catch((err) => {
        error('Failure to perform userbytokenid', err, {token});
      });
  });

  onMessageFromBrowserWindow('minimize-me', () => withHomeWindow((w) => w.hide()));

  onMessageFromBrowserWindow('open-link', (link) => {
    shell.openExternal(link).catch((err) => {
      error('Failure to open link', err, {link});
    });
  });

  onMessageFromBrowserWindow('set-setting-autorun', (newAutorun) => {
    const settings = settingsStore.get();
    settings.autorun = newAutorun;
    settingsStore.save();

    if (newAutorun) {
      enableAutoLauncher();
    } else {
      disableAutoLauncher();
    }
  });

  onMessageFromBrowserWindow('set-setting-minimized', (newMinimized) => {
    const settings = settingsStore.get();
    settings.minimized = newMinimized;
    settingsStore.save();
  });

  onMessageFromBrowserWindow('set-setting-manualupdate', (newManualUpdate) => {
    const settings = settingsStore.get();
    settings.manualUpdate = newManualUpdate;
    settingsStore.save();
  });

  onMessageFromBrowserWindow('set-setting-overlay', (newOverlay) => {
    const settings = settingsStore.get();
    settings.overlay = newOverlay;
    settingsStore.save();
  });

  onMessageFromBrowserWindow('set-setting-do-uploads', (newUploads) => {
    const settings = settingsStore.get();
    settings.uploads = newUploads;
    settingsStore.save();
  });

  onMessageFromBrowserWindow('set-setting-disable-hotkeys', (newHotkeys) => {
    const settings = settingsStore.get();
    settings.nohotkeys = newHotkeys;
    settingsStore.save();
    unRegisterHotkeys();
  });

  onMessageFromBrowserWindow('set-setting-icon', (newIcon) => {
    const settings = settingsStore.get();
    settings.icon = newIcon;
    settingsStore.save();

    sendMessageToOverlayWindow('set-icosettings', newIcon);

    withHomeWindow((w) => {
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
    'detach',
    'hidemain',
  ];

  overlaySettingsBoolean.forEach((setting) => {
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
    const settingName = `set-setting-o-${settingType}` as
      | 'set-setting-o-hidezero'
      | 'set-setting-o-hidemy'
      | 'set-setting-o-hideopp'
      | 'set-setting-o-showcardicon'
      | 'set-setting-o-neverhide'
      | 'set-setting-o-mydecks'
      | 'set-setting-o-cardhover'
      | 'set-setting-o-timers'
      | 'set-setting-o-detach'
      | 'set-setting-o-hidemain';
    onMessageFromBrowserWindow(settingName, (newOverlaySetting) => {
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
          savepositiontop: 0,
          savepositionleft: 0,
          savepositiontopopp: 0,
          savepositionleftopp: 0,
          savescale: 0,
          opacity: 0,
          fontcolor: 0,
          detach: false,
          hidemain: false,
        };
      }
      session.overlaySettings[settingType] = newOverlaySetting;
      settingsStore.save();
      sendMessageToOverlayWindow('set-ovlsettings', session.overlaySettings);
    });
  });

  const overlaySettingsNumber = [
    'leftdigit',
    'rightdigit',
    'bottomdigit',
    'leftdraftdigit',
    'rightdraftdigit',
    'savescale',
    'savepositiontop',
    'savepositionleft',
    'savepositiontopopp',
    'savepositionleftopp',
    'opacity',
    'fontcolor',
  ];

  overlaySettingsNumber.forEach((setting) => {
    const settingType = setting as
      | 'leftdigit'
      | 'rightdigit'
      | 'bottomdigit'
      | 'leftdraftdigit'
      | 'rightdraftdigit'
      | 'savescale'
      | 'savepositiontop'
      | 'savepositionleft'
      | 'savepositiontopopp'
      | 'savepositionleftopp'
      | 'opacity'
      | 'fontcolor';
    const settingName = `set-setting-o-${settingType}` as
      | 'set-setting-o-leftdigit'
      | 'set-setting-o-rightdigit'
      | 'set-setting-o-bottomdigit'
      | 'set-setting-o-leftdraftdigit'
      | 'set-setting-o-rightdraftdigit'
      | 'set-setting-o-savescale'
      | 'set-setting-o-opacity'
      | 'set-setting-o-savepositiontop'
      | 'set-setting-o-savepositionleft'
      | 'set-setting-o-savepositiontopopp'
      | 'set-setting-o-savepositionleftopp'
      | 'set-setting-o-fontcolor';
    onMessageFromBrowserWindow(settingName, (newOverlaySetting) => {
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
          savepositiontop: 0,
          savepositionleft: 0,
          savepositiontopopp: 0,
          savepositionleftopp: 0,
          savescale: 0,
          opacity: 0,
          fontcolor: 0,
          detach: false,
          hidemain: false,
        };
      }
      session.overlaySettings[settingType] = newOverlaySetting;
      settingsStore.save();
      sendMessageToOverlayWindow('set-ovlsettings', session.overlaySettings);
    });
  });

  /*OVERLAY SETTINGS END*/

  /*HOTKEY SETTINGS BEGIN*/

  const hkSettings = [
    'hk-my-deck',
    'hk-opp-deck',
    'hk-overlay',
    'hk-inc-size',
    'hk-dec-size',
    'hk-inc-opac',
    'hk-dec-opac',
  ];

  hkSettings.forEach((settings) => {
    const set = settings as
      | 'hk-my-deck'
      | 'hk-opp-deck'
      | 'hk-overlay'
      | 'hk-inc-size'
      | 'hk-dec-size'
      | 'hk-inc-opac'
      | 'hk-dec-opac';
    onMessageFromBrowserWindow(set, (newHotkeyBinding) => {
      const session = settingsStore.getAccount();
      if (session === undefined) {
        return;
      }
      if (session.hotkeysSettings === undefined) {
        return;
      }
      session.hotkeysSettings[set] = newHotkeyBinding;
      settingsStore.save();
      sendMessageToHomeWindow('set-hotkey-map', session.hotkeysSettings);
    });
  });

  /*HOTKEY SETTINGS END*/

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

    withLogParser((logParser) => {
      logParser.stop();
      sendMessageToHomeWindow('new-account', undefined);
    });

    sendSettingsToRenderer();
  });

  onMessageFromBrowserWindow('set-log-path', () => {
    dialog
      .showOpenDialog({properties: ['openFile'], filters: [{name: 'output_*', extensions: ['txt']}]})
      .then((log) => {
        if (!log.canceled && log.filePaths[0]) {
          settingsStore.get().logPath = log.filePaths[0];
          settingsStore.save();
          sendMessageToHomeWindow('show-prompt', {message: 'Log path have been updated!', autoclose: 1000});
          sendSettingsToRenderer();
        }
      })
      .catch((err) => error('Error while showing open file dialog during set-log-path event', err));
  });

  onMessageFromBrowserWindow('default-log-path', () => {
    settingsStore.get().logPath = undefined;
    settingsStore.save();
    sendMessageToHomeWindow('show-prompt', {message: 'Log path have been set to default!', autoclose: 1000});
    sendSettingsToRenderer();
  });

  onMessageFromBrowserWindow('set-mtga-path', () => {
    dialog
      .showOpenDialog({properties: ['openDirectory']})
      .then((log) => {
        if (!log.canceled && log.filePaths[0]) {
          settingsStore.get().mtgaPath = log.filePaths[0];
          settingsStore.save();
          if (locateMtgaDir(log.filePaths[0])) {
            sendMessageToHomeWindow('show-prompt', {message: 'MTGA path have been updated!', autoclose: 1000});
          } else {
            sendMessageToHomeWindow('show-prompt', {
              message: 'Bad MTGA path, please set it correctly',
              autoclose: 1000,
            });
          }
          sendSettingsToRenderer();
        }
      })
      .catch((err) => error('Error while showing open file dialog during set-mtga-path event', err));
  });

  onMessageFromBrowserWindow('default-mtga-path', () => {
    settingsStore.get().mtgaPath = undefined;
    settingsStore.save();
    if (locateMtgaDir(undefined)) {
      sendMessageToHomeWindow('show-prompt', {message: 'MTGA path have been set to default!', autoclose: 1000});
    } else {
      sendMessageToHomeWindow('show-prompt', {message: 'Bad MTGA path, please set it correctly', autoclose: 1000});
    }
    sendSettingsToRenderer();
  });

  onMessageFromBrowserWindow('do-shadow-sync', () => {
    if (!oldLogHandlerStatus.ReadingOldLogs) {
      ShadowLogParse();
    } else {
      sendMessageToHomeWindow('show-prompt', {message: 'Old logs are already being parsed', autoclose: 1000});
    }
  });

  onMessageFromBrowserWindow('stop-shadow-sync', () => {
    sendMessageToHomeWindow('show-status', {message: 'Stopping parser...', color: '#22a83a'});
    oldLogHandlerStatus.AbortOldLogs = true;
  });

  onMessageFromBrowserWindow('old-log', () => {
    if (!oldLogHandlerStatus.ReadingOldLogs) {
      const logpath = settingsStore.get().mtgaPath;
      dialog
        .showOpenDialog({
          properties: ['openFile', 'multiSelections'],
          defaultPath: logpath !== undefined ? join(logpath, ...['MTGA_Data', 'Logs', 'Logs']) : '',
          filters: [{name: 'UTC_Log*', extensions: ['log']}],
        })
        .then((log) => {
          if (!log.canceled && log.filePaths[0]) {
            parseOldLogsHandler(log.filePaths, 0, 0);
          }
        })
        .catch((err) => error('Error while showing open file dialog during old-log-path event', err));
    } else {
      sendMessageToHomeWindow('show-prompt', {message: 'Old logs are already being parsed', autoclose: 1000});
    }
  });

  onMessageFromBrowserWindow('dev-log', () => {
    if (!oldLogHandlerStatus.ReadingOldLogs) {
      const logpath = settingsStore.get().mtgaPath;
      dialog
        .showOpenDialog({
          properties: ['openFile', 'multiSelections'],
          defaultPath: logpath !== undefined ? join(logpath, ...['MTGA_Data', 'Logs', 'Logs']) : '',
          filters: [{name: 'UTC_Log*', extensions: ['log']}],
        })
        .then((log) => {
          if (!log.canceled && log.filePaths[0]) {
            parseOldLogsHandler(log.filePaths, 0, 0, undefined, true);
          }
        })
        .catch((err) => error('Error while showing open file dialog during old-log-path event', err));
    } else {
      sendMessageToHomeWindow('show-prompt', {message: 'Old logs are already being parsed', autoclose: 1000});
    }
  });

  onMessageFromBrowserWindow('error-in-renderer', (err) => {
    error('Error in renderer process', err.error, {line: err.line, url: err.url});
  });

  onMessageFromBrowserWindow('restart-me', () => {
    sendMessageToHomeWindow('show-prompt', {
      message: 'Restarting tracker...',
      autoclose: 0,
    });
    app.relaunch();
    app.exit();
  });

  onMessageFromBrowserWindow('wipe-position', () => {
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
        savepositiontop: 0,
        savepositionleft: 0,
        savepositiontopopp: 0,
        savepositionleftopp: 0,
        savescale: 0,
        opacity: 0,
        fontcolor: 0,
        detach: false,
        hidemain: false,
      };
    }

    session.overlaySettings['savepositiontop'] = 0;
    session.overlaySettings['savepositionleft'] = 0;
    session.overlaySettings['savepositiontopopp'] = 0;
    session.overlaySettings['savepositionleftopp'] = 0;
    settingsStore.save();
    sendMessageToOverlayWindow('set-ovlsettings', session.overlaySettings);
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
    withOverlayWindow((overlayWindow) => {
      overlayWindow.setIgnoreMouseEvents(false);
    });
  });

  onMessageFromBrowserWindow('disable-clicks', () => {
    withOverlayWindow((overlayWindow) => {
      overlayWindow.setIgnoreMouseEvents(true, {forward: true});
    });
  });
}
