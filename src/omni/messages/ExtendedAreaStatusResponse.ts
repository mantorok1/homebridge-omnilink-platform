import { ApplicationDataResponse } from './ApplicationDataResponse';

export class ExtendedAreaStatusResponse extends ApplicationDataResponse {

  private readonly _id: number[] = [];
  private readonly _mode: number[] = [];
  private readonly _alarms: number[] = [];
  private readonly _entryTimer: number[] = [];
  private readonly _exitTimer: number[] = [];

  constructor(message: Buffer) {
    super(message);

    const recordLength = message[4];
    const areaCount = (message[1] - 3) / recordLength;
    let offset = 5;
    for(let i = 1; i <= areaCount; i++) {
      this._id.push(message.readUInt16BE(offset));
      this._mode.push(message[offset + 2]);
      this._alarms.push(message[offset + 3]);
      this._entryTimer.push(message[offset + 4]);
      this._exitTimer.push(message[offset + 5]);
      offset += recordLength;
    }
  }

  get id(): number[] {
    return this._id;
  }

  get mode(): number[] {
    return this._mode;
  }

  get alarms(): number[] {
    return this._alarms;
  }

  get entryTimer(): number[] {
    return this._entryTimer;
  }

  get exitTimer(): number[] {
    return this._exitTimer;
  }
}