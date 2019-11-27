import {App, dialog, ipcMain, nativeImage} from 'electron';
import path from 'path';

import {setuserdata, UserData} from 'root/api/userbytokenid';
import {loadAppIcon} from 'root/app/app_icon';
import {sendSettingsToRenderer} from 'root/app/auth';
import {disableAutoLauncher, enableAutoLauncher} from 'root/app/auto_launcher';
import {checkForUpdates, quitAndInstall} from 'root/app/auto_updater';
import {withMainWindow} from 'root/app/main_window';
import {createLogParser, getLogParser, withLogParser} from 'root/lib/log_parser';
import {error} from 'root/lib/logger';
import {Account, settingsStore} from 'root/lib/settings_store';

export function setupIpcMain(app: App): void {
  ipcMain.on('token-input', (_, arg) => {
    const settings = settingsStore.get();
    if (settings.userToken !== arg.token) {
      // Setting new account
      settings.userToken = arg.token;
      settingsStore.removeAccount(arg.token);
      const newAccount: Account = {
        uid: arg.uid,
        token: arg.token,
        nick: arg.nick,
        overlay: false,
      };
      settings.accounts.push(newAccount);

      const awaiting = settingsStore.get().awaiting;
      if (awaiting) {
        withLogParser(logParser => logParser.setPlayerId(awaiting.playerId, awaiting.screenName));
        newAccount.player = awaiting;

        const userData: UserData = {
          mtgaId: awaiting.playerId,
          mtgaNick: awaiting.screenName,
          language: awaiting.language,
          token: arg.token,
        };

        const version = app.getVersion();
        setuserdata(userData, version).catch(err => {
          error('Failure to set user data after a token-input event', err, {...userData, version});
        });

        settings.awaiting = undefined;
      }

      // Don't forget to save on disk
      settingsStore.save();
    }
  });

  ipcMain.on('minimize-me', () => withMainWindow(w => w.minimize()));

  ipcMain.on('set-setting', (_, arg) => {
    settingsStore.set(arg.settings);
    // store.set(arg.setting, arg.data);
    switch (arg.setting) {
      case 'autorun':
        if (arg.data) {
          enableAutoLauncher();
        } else {
          disableAutoLauncher();
        }
        break;
      case 'icon':
        withMainWindow(w => {
          const icon = loadAppIcon(arg.data);
          const newico = nativeImage.createFromPath(path.join(__dirname, icon));
          w.Tray.setImage(newico);
          w.setIcon(newico);
        });
        break;
    }
    /*if (arg) {
      createOverlay();
    } else {
      overlayWindow.hide();
    }*/
  });

  ipcMain.on('kill-current-token', () => {
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
      withMainWindow(w => w.webContents.send('new-account'));
    });

    sendSettingsToRenderer();
  });

  ipcMain.on('set-log-path', (_, arg) => {
    dialog
      .showOpenDialog({properties: ['openFile'], filters: [{name: 'output_*', extensions: ['txt']}]})
      .then(log => {
        if (!log.canceled && log.filePaths[0]) {
          settingsStore.get().logPath = log.filePaths[0];
          settingsStore.save();
          withMainWindow(w =>
            w.webContents.send('showprompt', {message: 'Log path have been updated!', autoclose: 1000})
          );
          withLogParser(logParser => {
            logParser.stop();
            createLogParser();
          });
          sendSettingsToRenderer();
        }
      })
      .catch(err => error('Error while showing open file dialog during set-log-path event', err));
  });

  ipcMain.on('default-log-path', (_, arg) => {
    settingsStore.get().logPath = undefined;
    settingsStore.save();
    withLogParser(logParser => {
      withMainWindow(w =>
        w.webContents.send('showprompt', {message: 'Log path have been set to default!', autoclose: 1000})
      );
      logParser.stop();
      createLogParser();
    });
    sendSettingsToRenderer();
  });

  const ParseOldLogs = (logs: string[], index: number) => {
    withMainWindow(w =>
      w.webContents.send('showprompt', {
        message: `Parsing old log: ${index + 1}/${logs.length}`,
        autoclose: 0,
      })
    );
    if (getLogParser() !== undefined) {
      const parseOnce = createLogParser(logs[index], true);
      parseOnce.start();
      parseOnce.emitter.on('old-log-complete', () => {
        if (index + 1 === logs.length) {
          withMainWindow(w => w.webContents.send('showprompt', {message: 'Parsing complete!', autoclose: 1000}));
        } else {
          ParseOldLogs(logs, index + 1);
        }
      });
    }
  };

  ipcMain.on('old-log', (_, arg) => {
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

  ipcMain.on('wipe-all', (_, arg) => {
    settingsStore.wipe();
    withLogParser(logParser => {
      withMainWindow(w =>
        w.webContents.send('showprompt', {
          message: 'All settings have been wiped',
          autoclose: 1000,
        })
      );
      logParser.stop();
      logParser = createLogParser();
    });
    sendSettingsToRenderer();
  });

  ipcMain.on('check-updates', (_, arg) => {
    checkForUpdates();
  });

  ipcMain.on('stop-tracker', (_, arg) => {
    app.quit();
  });

  ipcMain.on('apply-update', () => {
    quitAndInstall();
  });
}
