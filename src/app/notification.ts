import {Notification} from 'electron';
import {join} from 'path';

import {getAppIcon} from 'root/app/app_icon';

export function showNotifi(title: string, body: string): void {
  const notification = new Notification({
    title,
    body,
    icon: join(__dirname, getAppIcon()),
  });
  notification.show();
}
