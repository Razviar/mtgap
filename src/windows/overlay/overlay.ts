// tslint:disable-next-line: no-import-side-effect
import 'root/windows/overlay/overlay.css';
import { ipcRenderer } from 'electron';

const MainOut = document.getElementById('MainOut') as HTMLElement;

ipcRenderer.on('draw-deck', (e, arg) => {});
