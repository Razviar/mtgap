import {getMetadata} from 'root/api/overlay';
import {ConnectionWaiter} from 'root/app/connection_waiter';
import {WindowLocator} from 'root/app/locatewindow';
import {withLogParser} from 'root/app/log_parser';
import {sendMessageToHomeWindow, sendMessageToOverlayWindow} from 'root/app/messages';
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
  const adder = 10000;
  connWait
    .pingMtga()
    .then(res => {
      if (res) {
        if (timeout > adder) {
          sendMessageToHomeWindow('show-prompt', {message: 'Connection established', autoclose: 1000});
        }
        withLogParser(logParser => logParser.start());
      } else {
        sendMessageToHomeWindow('show-status', {message: 'Connection Error', color: '#cc2d2d'});
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
          sendMessageToHomeWindow('show-status', {message: 'Game is not running!', color: '#dbb63d'});
          withOverlayWindow(w => w.hide());
        } else if (res !== -1) {
          let overlayWindow = getOverlayWindow();
          if (!overlayWindow) {
            overlayWindow = createOverlayWindow();
            getMetadata()
              .then(md => sendMessageToOverlayWindow('set-metadata', md))
              .catch(err => {
                error('Failure to load Metadata', err);
              });
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
