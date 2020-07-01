export interface PermissionEvents {
  accessibility: boolean;
  screenRecording: boolean;
}

export type PermissionListener<Event extends keyof PermissionEvents> = (data: PermissionEvents[Event]) => void;

export class PermissionEventEmitter {
  // tslint:disable-next-line:no-any
  private readonly listeners = new Map<string, ((data: any) => void)[]>();

  public on<Event extends keyof PermissionEvents>(event: Event, listener: PermissionListener<Event>): void {
    const listeners = this.listeners.get(event);
    if (listeners === undefined) {
      this.listeners.set(event, [listener]);
    } else {
      listeners.push(listener);
    }
  }

  public off<Event extends keyof PermissionEvents>(event: Event, listener: PermissionListener<Event>): void {
    const listeners = this.listeners.get(event);
    if (listeners === undefined) {
      return;
    }
    const index = listeners.indexOf(listener);
    if (index === -1) {
      return;
    }
    listeners.splice(index, 1);
  }

  protected emit<Event extends keyof PermissionEvents>(event: Event, data: PermissionEvents[Event]): void {
    const listeners = this.listeners.get(event);
    if (listeners === undefined) {
      return;
    }
    listeners.forEach((listener) => listener(data));
  }
}
