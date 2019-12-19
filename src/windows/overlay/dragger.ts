import {sendMessageToIpcMain} from 'root/windows/messages';

export function dragger(dragable: HTMLElement, handle: HTMLElement, currentScale: number): void {
  let pos1 = 0;
  let pos2 = 0;
  let pos3 = 0;
  let pos4 = 0;
  let isMoving = false;
  let newTop = 0;
  let newLeft = 0;

  /*console.log(rect.width + '/' + rect.height);
  console.log({windowBoundsX, windowBoundsY});*/

  const DraggingMouseMove = (ee: MouseEvent) => {
    const rect = dragable.getBoundingClientRect();
    const dopplerX = dragable.id === 'OpponentOutFrame' ? rect.width * currentScale - rect.width : 0;
    const windowBoundsX = window.innerWidth - rect.width + dopplerX;
    const windowBoundsY = window.innerHeight - rect.height;
    //console.log(dragable.id + '/' + rect.width + '/' + currentScale + '/' + rect.width * currentScale);

    ee.preventDefault();
    // calculate the new cursor position:
    pos1 = pos3 - ee.clientX;
    pos2 = pos4 - ee.clientY;
    pos3 = ee.clientX;
    pos4 = ee.clientY;

    newTop =
      dragable.offsetTop - pos2 > 0
        ? dragable.offsetTop - pos2 < windowBoundsY
          ? dragable.offsetTop - pos2
          : windowBoundsY
        : 0;
    newLeft =
      dragable.offsetLeft - pos1 > 0
        ? dragable.offsetLeft - pos1 < windowBoundsX
          ? dragable.offsetLeft - pos1
          : windowBoundsX
        : 0;

    dragable.style.top = `${newTop}px`;
    dragable.style.left = `${newLeft}px`;
  };

  const MouseUp = () => {
    isMoving = false;
    const windowBoundsX = window.innerWidth;
    const windowBoundsY = window.innerHeight;
    sendMessageToIpcMain('disable-clicks', undefined);
    if (dragable.id === 'MainDeckFrame') {
      sendMessageToIpcMain('set-setting-o-savepositiontop', (100 * newTop) / windowBoundsY);
      sendMessageToIpcMain('set-setting-o-savepositionleft', (100 * newLeft) / windowBoundsX);
    } else {
      sendMessageToIpcMain('set-setting-o-savepositiontopopp', (100 * newTop) / windowBoundsY);
      sendMessageToIpcMain('set-setting-o-savepositionleftopp', (100 * newLeft) / windowBoundsX);
    }

    document.removeEventListener('mousemove', DraggingMouseMove);
    document.removeEventListener('mouseup', MouseUp);
  };

  handle.addEventListener('mouseenter', () => {
    sendMessageToIpcMain('enable-clicks', undefined);
  });
  handle.addEventListener('mouseleave', () => {
    if (!isMoving) {
      sendMessageToIpcMain('disable-clicks', undefined);
    }
  });
  handle.addEventListener('mousedown', e => {
    isMoving = true;
    e.preventDefault();
    // get the mouse cursor position at startup:
    pos3 = e.clientX;
    pos4 = e.clientY;
    document.addEventListener('mousemove', DraggingMouseMove);
    document.addEventListener('mouseup', MouseUp);
  });
}
