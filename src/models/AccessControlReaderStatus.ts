export class AccessControlReaderStatus {
  private readonly _accessGranted: boolean;
  private readonly _lastUser: number;

  constructor(accessGranted: boolean, lastUser: number) {
    this._accessGranted = accessGranted;
    this._lastUser = lastUser;
  }

  get AccessGranted(): boolean {
    return this._accessGranted;
  }

  get LastUser(): number {
    return this._lastUser;
  }
}