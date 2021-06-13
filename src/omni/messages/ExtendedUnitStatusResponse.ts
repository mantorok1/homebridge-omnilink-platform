import { ApplicationDataResponse } from './ApplicationDataResponse';

export class ExtendedUnitStatusResponse extends ApplicationDataResponse {

  private readonly _id: number[] = [];
  private readonly _state: number[] = [];
  private readonly _timeRemaining: number[] = [];

  constructor(message: Buffer) {
    super(message);

    const recordLength = message[4];
    const unitCount = (message[1] - 3) / recordLength;
    let offset = 5;
    for(let i = 1; i <= unitCount; i++) {
      this._id.push(message.readUInt16BE(offset));
      this._state.push(message[offset + 2]);
      this._timeRemaining.push(message.readUInt16BE(offset + 3));
      offset += recordLength;
    }
  }

  get id(): number[] {
    return this._id;
  }

  get state(): number[] {
    return this._state;
  }

  get timeRemaining(): number[] {
    return this._timeRemaining;
  }
}