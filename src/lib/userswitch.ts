import {Account, settingsStore} from 'root/lib/settings_store';

export function getAccountFromScreenName(screenName: string): Account | undefined {
  return settingsStore.get().accounts.find(_ => _.player && _.player.screenName === screenName);
}
