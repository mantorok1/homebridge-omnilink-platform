import { ApplicationDataResponse } from './ApplicationDataResponse';
import { AccessControlReaderStatus } from '../../models/AccessControlReaderStatus';

export class ExtendedAccessControlReaderStatusResponse extends ApplicationDataResponse {

  private _readers!: Map<number, AccessControlReaderStatus>;

  get readers(): Map<number, AccessControlReaderStatus> {
    return this._readers;
  }

  deserialize(message: Buffer): void {
    super.deserialize(message);

    this._readers = new Map<number, AccessControlReaderStatus>();
    const readerCount = (message[1] - 3) / 4;

    for(let i = 1; i <= readerCount; i++) {
      const startPos = (i - 1) * 4 + 5;
      const readerId = message[startPos] * 256 + message[startPos + 1];
      const accessGranted = message[startPos + 2] === 0;
      const lastUser = message[startPos + 3];
      const status = new AccessControlReaderStatus(accessGranted, lastUser);
      this._readers.set(readerId, status);
    }
  }
}