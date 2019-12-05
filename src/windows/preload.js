const {ipcRenderer} = require('electron');

function messageFromMainHandler(channel, event) {
  window.postMessage(event, '*');
}

function messageFromWebHandler(event) {
  ipcRenderer.send('bridge-message', event.data);
}

ipcRenderer.on('bridge-message', messageFromMainHandler);
window.addEventListener('message', messageFromWebHandler, false);
