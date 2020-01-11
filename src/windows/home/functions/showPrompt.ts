import {HomePageElements} from 'root/windows/home/home';

export function showPrompt(message: string, autohide: number = 0): void {
  HomePageElements.PromptWnd.style.display = 'block';
  HomePageElements.PromptText.innerHTML = message;
  if (autohide > 0) {
    setTimeout(() => {
      HomePageElements.PromptWnd.style.display = 'none';
    }, autohide);
  }
}
