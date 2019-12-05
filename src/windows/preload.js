const {ipcRenderer} = require('electron');

function messageFromMainHandler(channel, data) {
  window.postMessage(data, '*');
}

function messageFromWebHandler(event) {
  ipcRenderer.send('bridge-message', event.data.data);
}

ipcRenderer.on('bridge-message', messageFromMainHandler);
window.addEventListener('message', messageFromWebHandler, false);
