import { store } from 'root/main';

export function UserSwitch(mtgaId: string): string {
  console.log(mtgaId);
  const settings = store.get('settings');
  if (settings) {
    const result = Object.entries(settings).find(user => {
      const userdata = user[1] as { [index: string]: string };
      return userdata.playerId === mtgaId;
    });
    if (result) {
      return result[0];
    }
    return '';
  }
  return '';
}
