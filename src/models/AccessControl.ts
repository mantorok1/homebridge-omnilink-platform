import { OmniObjectBase, OmniObjectBaseArgs, OmniObjectTypes } from './OmniObjectBase';

export enum LockStates {
  Locked = 0,
  Unlocked = 1
}

export enum AccessStates {
  Granted = 0,
  Denied = 1
}

interface LockStatusArgs {
  lockState: number,
  unlockTimer: number
}

interface ReaderStatusArgs {
  readerState: number,
  lastUser: number
}

interface AccessControlArgs extends OmniObjectBaseArgs, LockStatusArgs, ReaderStatusArgs {
}

export class AccessControl extends OmniObjectBase {

  private _lockStatus: AccessControlLockStatus;
  private _readerStatus: AccessControlReaderStatus;

  constructor(args: AccessControlArgs) {
    super(OmniObjectTypes.AccessControl, args);

    this._lockStatus = new AccessControlLockStatus(args);
    this._readerStatus = new AccessControlReaderStatus(args);
  }

  get lockStatus(): AccessControlLockStatus {
    return this._lockStatus;
  }

  set lockStatus(value: AccessControlLockStatus) {
    this._lockStatus = value;
  }

  get readerStatus(): AccessControlReaderStatus {
    return this._readerStatus;
  }

  set readerStatus(value: AccessControlReaderStatus) {
    this._readerStatus = value;
  }
}

export class AccessControlLockStatus {
  private readonly _state: LockStates;
  private readonly _unlockTimer: number;

  constructor(args: LockStatusArgs) {
    this._state = args.lockState;
    this._unlockTimer = args.unlockTimer;
  }

  equals(status: AccessControlLockStatus | undefined): boolean {
    return status === undefined
      ? false
      : (this.state === status.state && this.unlockTimer === status.unlockTimer);
  }

  toString(): string {
    return LockStates[this.state];
  }

  get state(): LockStates {
    return this._state;
  }

  get locked(): boolean {
    return this._state === LockStates.Locked;
  }

  get unlockTimer(): number {
    return this._unlockTimer;
  }
}

export class AccessControlReaderStatus {
  private readonly _state: AccessStates;
  private readonly _lastUser: number;

  constructor(args: ReaderStatusArgs) {
    this._state = args.readerState;
    this._lastUser = args.lastUser;
  }

  equals(status: AccessControlReaderStatus | undefined): boolean {
    return status === undefined
      ? false
      : (this.state === status.state && this.lastUser === status.lastUser);
  }

  toString(): string {
    return AccessStates[this.state];
  }

  get state(): AccessStates {
    return this._state;
  }

  get lastUser(): number {
    return this._lastUser;
  }
}