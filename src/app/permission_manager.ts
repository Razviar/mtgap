import {systemPreferences} from 'electron';

import {PermissionEventEmitter, PermissionEvents, PermissionListener} from 'root/app/permission_events';
import {isMac} from 'root/lib/utils';
import {error} from 'root/lib/logger';

class PermissionManager extends PermissionEventEmitter {
  private fetchInterval: NodeJS.Timeout | undefined;
  private isAccessibilityOk = !isMac();
  private isScreenRecordingOk = !isMac();
  private canShowInvitation = true;
  private macPermissions: undefined;

  private readonly fetchMillis = 1000;

  public init(): void {
    if (!isMac() || this.fetchInterval !== undefined) {
      return;
    }
    this.checkAuthStatus();
    this.fetchInterval = setInterval(() => this.checkAuthStatus(), this.fetchMillis);
    try {
      // tslint:disable-next-line: no-require-imports no-unsafe-any
      this.macPermissions = require('node-mac-permissions');
    } catch (e) {
      error('The node-mac-permissions optional dependency is required on Mac!', e);
    }
  }

  private checkAuthStatus(): void {
    if (!isMac()) {
      return;
    }
    // tslint:disable-next-line: no-unsafe-any
    const isAccessibilityOk = this.macPermissions.getAuthStatus('accessibility') === 'authorized';
    if (this.isAccessibilityOk !== isAccessibilityOk) {
      this.isAccessibilityOk = isAccessibilityOk;
      this.emit('accessibility', isAccessibilityOk);
    }
    // tslint:disable-next-line: no-unsafe-any
    const isScreenRecordingOk = this.macPermissions.getAuthStatus('screen') === 'authorized';
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
      // tslint:disable-next-line: no-unsafe-any
      this.macPermissions.askForScreenCaptureAccess();
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
