export class AccessControlLockStatus {
  private readonly _locked: boolean;
  private readonly _unlockTimer: number;

  constructor(locked: boolean, unlockTimer: number) {
    this._locked = locked;
    this._unlockTimer = unlockTimer;
  }

  get locked(): boolean {
    return this._locked;
  }

  get unlockTimer(): number {
    return this._unlockTimer;
  }
}