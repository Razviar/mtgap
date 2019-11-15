import { store } from 'root/main';

export function UserSwitch(screenName: string): string {
  //console.log('UserSwitch:' + screenName);
  const settings = store.get('settings');
  //console.log(settings);
  if (settings) {
    const result = Object.entries(settings).find(user => {
      const userdata = user[1] as { [index: string]: string };
      return userdata.screenName === screenName;
    });
    if (result) {
      return result[0];
    }
    return '';
  }
  return '';
}
