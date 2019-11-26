import {App, app} from 'electron';

import {withMainWindow} from 'root/app/main_window';
import {createOverlayWindow, getOverlayWindow, withOverlayWindow} from 'root/app/overlay_window';
import {ConnectionWaiter} from 'root/lib/connection_waiter';
import {WindowLocator} from 'root/lib/locatewindow';
import {withLogParser} from 'root/lib/log_parser';
import {error} from 'root/lib/logger';
import {ProcessWatcher} from 'root/lib/watchprocess';
import {store} from 'root/main';

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
          withMainWindow(w => w.webContents.send('showprompt', {message: 'Connection established', autoclose: 1000}));
        }
        //console.log('COnnection Restored');
        withLogParser(logParser => logParser.start());
      } else {
        withMainWindow(w => {
          w.webContents.send('show-status', {
            color: '#cc2d2d',
            message: 'Connection Error',
          });
          w.webContents.send('showprompt', {message: 'Awaiting connection!', autoclose: 0});
        });
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
          withMainWindow(w =>
            w.webContents.send('show-status', {
              color: '#dbb63d',
              message: 'Game is not running!',
            })
          );
          withOverlayWindow(w => w.hide());
        } else if (res !== -1) {
          let overlayWindow = getOverlayWindow();
          if (!overlayWindow) {
            overlayWindow = createOverlayWindow();
          }
          if (store.get('overlay')) {
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
      .catch(err => error('Process watcher failed while checked for the process', err));
  };

  return processWatcherFn;
}
