import {sendMessageToIpcMain} from 'root/windows/messages';

export function linkclick(event: Event): void {
  const cl: HTMLElement = event.target as HTMLElement;
  const link = cl.getAttribute('data-link');
  if (link !== null && link.length > 0) {
    sendMessageToIpcMain('open-link', link);
  }
}
