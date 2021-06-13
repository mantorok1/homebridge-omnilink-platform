import { ObjectPropertiesResponse } from './ObjectPropertiesResponse';

export class AccessControlPropertiesResponse extends ObjectPropertiesResponse {

  private _lockState: number;
  private _unlockTimer: number;
  private _readerState: number;
  private _lastUser: number;

  constructor(message: Buffer) {
    super(message, 11, 26);

    this._lockState = message[6];
    this._unlockTimer = message.readUInt16BE(7);
    this._readerState = message[9];
    this._lastUser = message[10];
  }

  get lockState(): number {
    return this._lockState;
  }

  get unlockTimer(): number {
    return this._unlockTimer;
  }

  get readerState(): number {
    return this._readerState;
  }

  get lastUser(): number {
    return this._lastUser;
  }
}