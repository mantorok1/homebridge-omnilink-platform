import { ApplicationDataResponse } from './ApplicationDataResponse';

export class ExtendedAccessControlReaderStatusResponse extends ApplicationDataResponse {

  private _id: number[] = [];
  private _accessState: number[] = [];
  private _lastUser: number[] = [];

  constructor(message: Buffer) {
    super(message);

    const recordLength = message[4];
    const lockCount = (message[1] - 3) / recordLength;
    let offset = 5;
    for(let i = 1; i <= lockCount; i++) {
      this._id.push(message.readUInt16BE(offset));
      this._accessState.push(message[offset + 2]);
      this._lastUser.push(message[offset + 3]);
      offset += recordLength;
    }
  }

  get id(): number[] {
    return this._id;
  }

  get accessState(): number[] {
    return this._accessState;
  }

  get lastUser(): number[] {
    return this._lastUser;
  }
}