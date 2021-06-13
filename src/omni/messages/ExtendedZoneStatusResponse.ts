import { ApplicationDataResponse } from './ApplicationDataResponse';

export class ExtendedZoneStatusResponse extends ApplicationDataResponse {

  private readonly _id: number[] = [];
  private readonly _state: number[] = [];
  private readonly _loopReading: number[] = [];

  constructor(message: Buffer) {
    super(message);

    const recordLength = message[4];
    const zoneCount = (message[1] - 3) / recordLength;
    let offset = 5;
    for(let i = 1; i <= zoneCount; i++) {
      this._id.push(message.readUInt16BE(offset));
      this._state.push(message[offset + 2]);
      this._loopReading.push(message[offset + 3]);
      offset += recordLength;
    }
  }

  get id(): number[] {
    return this._id;
  }

  get state(): number[] {
    return this._state;
  }

  get loopReading(): number[] {
    return this._loopReading;
  }
}