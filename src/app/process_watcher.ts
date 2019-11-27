import {app} from 'electron';

import {ConnectionWaiter} from 'root/app/connection_waiter';
import {WindowLocator} from 'root/app/locatewindow';
import {withLogParser} from 'root/app/log_parser';
import {withHomeWindow} from 'root/app/main_window';
import {sendMessageToHomeWindow} from 'root/app/messages';
import {createOverlayWindow, getOverlayWindow, withOverlayWindow} from 'root/app/overlay_window';
import {settingsStore} from 'root/app/settings_store';
import {ProcessWatcher} from 'root/app/watchprocess';
import {error} from 'root/lib/logger';

let MTGApid = -1;
const MovementSensetivity = 5;

const overlayPositioner = new WindowLocator();
const processWatcher = new ProcessWatcher('MTGA.exe');
const connWait = new ConnectionWaiter();

export const connectionWaiter = (timeout: number) => {
  const adder = 1000;
  connWait
    .pingMtga(app.getVersion())
    .then(res => {
      if (res) {
        if (timeout > 1000) {
          sendMessageToHomeWindow('show-prompt', {message: 'Connection established', autoclose: 1000});
        }
        withLogParser(logParser => logParser.start());
      } else {
        sendMessageToHomeWindow('show-status', {color: '#cc2d2d', message: 'Connection Error'});
        sendMessageToHomeWindow('show-prompt', {message: 'Awaiting connection!', autoclose: 0});
        setTimeout(() => {
          connectionWaiter(timeout + adder);
        }, timeout);
      }
    })
    .catch(err => error('Connection waiter failed while pinging the server', err));
};

export function setupProcessWatcher(): () => void {
  const processWatcherFn = () => {
    processWatcher
      .getprocesses()
      .then(res => {
        MTGApid = res;
        overlayPositioner.findmtga(MTGApid);
        if (res === -1 && connWait.status) {
          sendMessageToHomeWindow('show-status', {color: '#dbb63d', message: 'Game is not running!'});
          withOverlayWindow(w => w.hide());
        } else if (res !== -1) {
          let overlayWindow = getOverlayWindow();
          if (!overlayWindow) {
            overlayWindow = createOverlayWindow();
          }
          if (settingsStore.get().overlay) {
            if (
              overlayPositioner.bounds.width !== 0 &&
              (Math.abs(overlayWindow.getBounds().x - overlayPositioner.bounds.x) > MovementSensetivity ||
                Math.abs(overlayWindow.getBounds().y - overlayPositioner.bounds.y) > MovementSensetivity ||
                Math.abs(overlayWindow.getBounds().width - overlayPositioner.bounds.width) > MovementSensetivity ||
                Math.abs(overlayWindow.getBounds().height - overlayPositioner.bounds.height) > MovementSensetivity)
            ) {
              /*console.log(overlayPositioner.bounds);
                console.log(overlayWindow.getBounds());*/
              if (!overlayWindow.isVisible()) {
                overlayWindow.show();
              }
              overlayWindow.setBounds(overlayPositioner.bounds);
            } else if (overlayPositioner.bounds.width === 0) {
              overlayWindow.hide();
            } else {
              if (!overlayWindow.isVisible()) {
                overlayWindow.show();
              }
            }
          }
        }
      })
      .catch(_ => {});
  };

  return processWatcherFn;
}
