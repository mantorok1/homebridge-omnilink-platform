import { IStatus } from './IStatus';

export class AccessControlLockStatus implements IStatus {
  public readonly statusBuffer: Buffer;
  private readonly _locked: boolean;

  constructor(lockStatus: number) {
    this.statusBuffer = Buffer.from([lockStatus]);
    this._locked = lockStatus === 0;
  }

  static getKey(lockId: number): string {
    return `lock-${lockId}`;
  }

  equals(status: AccessControlLockStatus | undefined): boolean {
    return status === undefined
      ? false
      : (this.statusBuffer.equals(status.statusBuffer));
  }

  getKey(id: number): string {
    return AccessControlLockStatus.getKey(id);
  }

  get locked(): boolean {
    return this._locked;
  }
}