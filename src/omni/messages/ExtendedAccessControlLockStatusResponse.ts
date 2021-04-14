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
    const lockCount = (message[1] - 3) / 5;

    for(let i = 1; i <= lockCount; i++) {
      const startPos = (i - 1) * 5 + 5;
      const lockId = message[startPos] * 256 + message[startPos + 1];
      const locked = message[startPos + 2] === 0;
      const unlockTimer = message[startPos + 3] * 256 + message[startPos + 4];
      const status = new AccessControlLockStatus(locked, unlockTimer);
      this._locks.set(lockId, status);
    }
  }
}