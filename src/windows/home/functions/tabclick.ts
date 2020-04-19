import {HomePageElements} from 'root/windows/home/home';

export const tabclick = (event: Event) => {
  const cl: HTMLElement = event.target as HTMLElement;
  const activate = cl.getAttribute('data-activate');

  Array.from(HomePageElements.buttons).forEach((el) => {
    const elem = el as HTMLElement;
    const clas = elem.classList;
    if (elem.getAttribute('data-activate') === activate) {
      clas.add('active');
    } else {
      clas.remove('active');
    }
  });
  Array.from(HomePageElements.tabs).forEach((el) => {
    const elem = el as HTMLElement;
    const clas = elem.classList;
    if (elem.id === activate) {
      clas.add('activetab');
    } else {
      clas.remove('activetab');
    }
  });
};
