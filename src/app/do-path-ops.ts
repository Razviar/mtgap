import {Notification} from 'electron';
import {join} from 'path';

import {getAppIcon} from 'root/app/app_icon';
import {uploadCardData} from 'root/app/cards_uploader';
import {withHomeWindow} from 'root/app/main_window';
import {sendMessageToHomeWindow} from 'root/app/messages';
import {locateMtgaDir} from 'root/app/mtga_dir_ops';
import {settingsStore} from 'root/app/settings-store/settings_store';

export function doMtgaPathOps(): void {
  let mtgaPath = settingsStore.get().mtgaPath;
  if (mtgaPath === undefined && locateMtgaDir(mtgaPath)) {
    mtgaPath = settingsStore.get().mtgaPath;
  }
  if (mtgaPath === undefined) {
    sendMessageToHomeWindow('show-prompt', {
      message: 'Please set up path to MTGA folder!',
      autoclose: 1000,
    });
    withHomeWindow(w => {
      if (!w.isVisible()) {
        const notification = new Notification({
          title: 'Set MTGA folder for Tracker',
          body: 'MTGA installation folder was not located automatically. Please set it up manually in settings!',
          icon: join(__dirname, getAppIcon()),
        });
        notification.show();
      }
    });
  }
  if (settingsStore.get().uploads && mtgaPath !== undefined) {
    uploadCardData(['data_loc_', 'data_cards_'], [mtgaPath, 'MTGA_Data', 'Downloads', 'Data']);
    uploadCardData(['loc_Events_'], [mtgaPath, 'MTGA_Data', 'Downloads', 'Loc']);
  }
}
