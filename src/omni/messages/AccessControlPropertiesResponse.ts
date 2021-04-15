import { ObjectPropertiesResponse } from './ObjectPropertiesResponse';

export class AccessControlPropertiesResponse extends ObjectPropertiesResponse {

  private _locked?: boolean;
  private _unlockTimer?: number;
  private _accessGranted?: boolean;
  private _lastUser?: number;

  get locked(): boolean {
    return this._locked!;
  }
  
  deserialize(message: Buffer): void {
    super.deserialize(message);

    this._locked = message[6] === 0;
    this._unlockTimer = message[7] * 256 + message[8];
    this._accessGranted = message[9] === 0;
    this._lastUser = message[10];
    this._name = this.getName(message.subarray(11, 26), 'Reader');
  }
}