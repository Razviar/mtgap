const {ipcRenderer, webFrame} = require('electron');

function messageFromMainHandler(channel, event) {
  window.postMessage(event, '*');
}

function messageFromWebHandler(event) {
  if (event.data.message === 'set-scale') {
    webFrame.setZoomFactor(event.data.data);
  } else {
    ipcRenderer.send('bridge-message', event.data);
  }
}

ipcRenderer.on('bridge-message', messageFromMainHandler);
window.addEventListener('message', messageFromWebHandler, false);
