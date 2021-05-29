import { ApplicationDataResponse } from './ApplicationDataResponse';
import { AccessControlLockStatus } from '../../models/AccessControlLockStatus';

export class ExtendedAccessControlLockStatusResponse extends ApplicationDataResponse {

  private _locks!: Map<number, AccessControlLockStatus>;

  get locks(): Map<number, AccessControlLockStatus> {
    return this._locks;
  }

  deserialize(message: Buffer): void {
    super.deserialize(message);

    this._locks = new Map<number, AccessControlLockStatus>();
    const recordLength = message[4];
    const lockCount = (message[1] - 3) / recordLength;

    for(let i = 1; i <= lockCount; i++) {
      const startPos = (i - 1) * recordLength + 5;
      const lockId = message[startPos] * 256 + message[startPos + 1];
      const status = new AccessControlLockStatus(message[startPos + 2]);
      this._locks.set(lockId, status);
    }
  }
}