import { ObjectPropertiesResponse } from './ObjectPropertiesResponse';
import { AccessControlLockStatus } from '../../models/AccessControlLockStatus';

export class AccessControlPropertiesResponse extends ObjectPropertiesResponse {

  private _status?: AccessControlLockStatus;

  get status(): AccessControlLockStatus {
    return this._status!;
  }

  deserialize(message: Buffer): void {
    super.deserialize(message);

    this._status = new AccessControlLockStatus(message[6]);
    this._name = this.getName(message.subarray(11, 26), 'Lock');
  }
}