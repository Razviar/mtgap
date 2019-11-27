import AutoLaunch from 'auto-launch';

import {error} from 'root/lib/logger';

const AutoLauncher = new AutoLaunch({
  name: 'mtgaprotracker',
});

export function enableAutoLauncher(): void {
  AutoLauncher.enable().catch(err => error('Failure to enable auto launcher', err));
}

export function disableAutoLauncher(): void {
  AutoLauncher.disable().catch(err => error('Failure to disable auto launcher', err));
}
