import {sendMessageToIpcMain} from 'root/windows/messages';

export function dragger(dragable: HTMLElement, handle: HTMLElement): void {
  let pos1 = 0;
  let pos2 = 0;
  let pos3 = 0;
  let pos4 = 0;
  let isMoving = false;

  /*console.log(rect.width + '/' + rect.height);
  console.log({windowBoundsX, windowBoundsY});*/

  const DraggingMouseMove = (ee: MouseEvent) => {
    const rect = dragable.getBoundingClientRect();
    const windowBoundsX = window.innerWidth - rect.width;
    const windowBoundsY = window.innerHeight - rect.height;

    ee.preventDefault();
    // calculate the new cursor position:
    pos1 = pos3 - ee.clientX;
    pos2 = pos4 - ee.clientY;
    pos3 = ee.clientX;
    pos4 = ee.clientY;

    const newTop =
      dragable.offsetTop - pos2 > 0
        ? dragable.offsetTop - pos2 < windowBoundsY
          ? dragable.offsetTop - pos2
          : windowBoundsY
        : 0;
    const newLeft =
      dragable.offsetLeft - pos1 > 0
        ? dragable.offsetLeft - pos1 < windowBoundsX
          ? dragable.offsetLeft - pos1
          : windowBoundsX
        : 0;

    dragable.style.top = `${newTop}px`;
    dragable.style.left = `${newLeft}px`;
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
    document.addEventListener('mouseup', () => {
      isMoving = false;
      sendMessageToIpcMain('disable-clicks', undefined);
      document.removeEventListener('mousemove', DraggingMouseMove);
    });
  });
}
