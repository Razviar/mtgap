import {Account, settingsStore} from 'root/app/settings-store/settings_store';

export function getAccountFromScreenName(screenName: string): Account | undefined {
  return settingsStore.get().accounts.find((_) => _.player && _.player.screenName === screenName);
}

export function getAccountFromPlayerId(playerId: string): Account | undefined {
  return settingsStore.get().accounts.find((_) => _.player && _.player.playerId === playerId);
}
