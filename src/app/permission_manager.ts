import {systemPreferences} from 'electron';

import {PermissionEventEmitter, PermissionEvents, PermissionListener} from 'root/app/permission_events';
import {isMac} from 'root/lib/utils';

class PermissionManager extends PermissionEventEmitter {
  private fetchInterval: NodeJS.Timeout | undefined;
  private isAccessibilityOk = !isMac();
  private isScreenRecordingOk = !isMac();
  private canShowInvitation = true;

  private readonly fetchMillis = 1000;

  public init(): void {
    if (!isMac() || this.fetchInterval !== undefined) {
      return;
    }
    this.checkAuthStatus();
    this.fetchInterval = setInterval(() => this.checkAuthStatus(), this.fetchMillis);
  }

  private checkAuthStatus(): void {
    // tslint:disable-next-line: no-require-imports no-unsafe-any
    const isAccessibilityOk = require('node-mac-permissions').getAuthStatus('accessibility') === 'authorized';
    if (this.isAccessibilityOk !== isAccessibilityOk) {
      this.isAccessibilityOk = isAccessibilityOk;
      this.emit('accessibility', isAccessibilityOk);
    }
    // tslint:disable-next-line: no-require-imports no-unsafe-any
    const isScreenRecordingOk = require('node-mac-permissions').getAuthStatus('screen') === 'authorized';
    if (this.isScreenRecordingOk !== isScreenRecordingOk) {
      this.isScreenRecordingOk = isScreenRecordingOk;
      this.emit('screenRecording', isScreenRecordingOk);
    }
  }

  public requireAccessibility(): void {
    if (isMac()) {
      systemPreferences.isTrustedAccessibilityClient(this.canShowInvitation);
      this.canShowInvitation = false;
    }
  }

  public requireScreenRecording(): void {
    if (isMac()) {
      // tslint:disable-next-line: no-require-imports no-unsafe-any
      require('node-mac-permissions').askForScreenCaptureAccess();
    }
  }

  public on<Event extends keyof PermissionEvents>(event: Event, listener: PermissionListener<Event>): void {
    super.on(event, listener);
    if (this.isAccessibilityOk) {
      this.emit('accessibility', this.isAccessibilityOk);
    }
    this.emit('screenRecording', this.isScreenRecordingOk);
  }
}

export const permissionManager = new PermissionManager();
