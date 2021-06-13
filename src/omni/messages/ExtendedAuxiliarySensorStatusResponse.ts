import { ApplicationDataResponse } from './ApplicationDataResponse';

export class ExtendedAuxiliarySensorStatusResponse extends ApplicationDataResponse {

  private readonly _id: number[] = [];
  private readonly _state: number[] = [];
  private readonly _temperature: number[] = [];
  private readonly _lowSetPoint: number[] = [];
  private readonly _highSetPoint: number[] = [];

  constructor(message: Buffer) {
    super(message);

    const recordLength = message[4];
    const sensorCount = (message[1] - 3) / recordLength;
    let offset = 5;
    for(let i = 1; i <= sensorCount; i++) {
      this._id.push(message.readUInt16BE(offset));
      this._state.push(message[offset + 2]);
      this._temperature.push(message[offset + 3]);
      this._lowSetPoint.push(message[offset + 4]);
      this._highSetPoint.push(message[offset + 5]);
      offset += recordLength;
    }
  }

  get id(): number[] {
    return this._id;
  }

  get state(): number[] {
    return this._state;
  }

  get temperature(): number[] {
    return this._temperature;
  }

  get lowSetPoint(): number[] {
    return this._lowSetPoint;
  }

  get highSetPoint(): number[] {
    return this._highSetPoint;
  }
}