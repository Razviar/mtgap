import {Notification} from 'electron';
import {join} from 'path';

import {getAppIcon} from 'root/app/app_icon';
import {isMac} from 'root/lib/utils';

export function showNotification(title: string, body: string): void {
  const notification = new Notification({
    title,
    body,
    icon: isMac() ? undefined : join(__dirname, getAppIcon()),
  });
  notification.show();
}
