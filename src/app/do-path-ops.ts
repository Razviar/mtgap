import {app} from 'electron';
import {join} from 'path';
import fs from 'fs';
import {uploadCardData} from 'root/app/cards_uploader';
import {withHomeWindow} from 'root/app/main_window';
import {sendMessageToHomeWindow} from 'root/app/messages';
import {locateMtgaDir} from 'root/app/mtga_dir_ops';
import {showNotification} from 'root/app/notification';
import {settingsStore} from 'root/app/settings-store/settings_store';
import {gameState} from 'root/app/game_state';

export function doMtgaPathOps(): void {
  const home = app.getAppPath();
  const checker = join(home, '.webpack', 'main', 'native_modules', 'SharpMonoInjector.dll');
  let sharpInPlace = false;
  try {
    const checkSharpMonoInjector = fs.statSync(checker);
    if (checkSharpMonoInjector.size && checkSharpMonoInjector.size > 24000) {
      sharpInPlace = true;
    }
  } catch (err) {}

  if (!sharpInPlace) {
    gameState.setAVBlocked();
    withHomeWindow((w) => {
      showNotification(
        'Please Restore SharpMonoInjector.dll!',
        'Your AV most likely removed SharpMonoInjector.dll, please add an exception for this file and re-install the tracker!'
      );
    });
  }

  let mtgaPath = settingsStore.get().mtgaPath;
  //console.log('mtgaPath1', mtgaPath);
  if (mtgaPath === undefined && locateMtgaDir(mtgaPath)) {
    mtgaPath = settingsStore.get().mtgaPath;
    //console.log('mtgaPath2', mtgaPath);
  }
  if (mtgaPath === undefined) {
    sendMessageToHomeWindow('show-prompt', {
      message: 'Please set up path to MTGA folder!',
      autoclose: 1000,
    });
    withHomeWindow((w) => {
      if (!w.isVisible()) {
        showNotification(
          'Set MTGA folder for Tracker',
          'MTGA installation folder was not located automatically. Please set it up manually in settings!'
        );
      }
    });
  }
  if (settingsStore.get().uploads && mtgaPath !== undefined) {
    //console.log('uploadCardData');
    uploadCardData(['Raw_CardDatabase', 'Raw_cards', 'Raw_ClientLocalization'], [mtgaPath, 'Downloads', 'Raw']);
  }
}
