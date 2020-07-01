declare module 'node-mac-permissions' {
  type AuthType =
    | 'contacts'
    | 'calendar'
    | 'reminders'
    | 'full-disk-access'
    | 'camera'
    | 'photos'
    | 'speech-recognition'
    | 'microphone'
    | 'accessibility'
    | 'location'
    | 'screen';

  type AuthStatus = 'not determined' | 'denied' | 'authorized' | 'restricted';

  function getAuthStatus(type: AuthType): AuthStatus;

  function askForScreenCaptureAccess(): void;
}
