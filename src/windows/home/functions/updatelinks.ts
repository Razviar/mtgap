import {linkclick} from 'root/windows/home/functions/linkclick';

export function updatelinks(): void {
  const links = document.getElementsByClassName('link');
  Array.from(links).forEach((el) => {
    el.addEventListener('click', linkclick);
  });
}
