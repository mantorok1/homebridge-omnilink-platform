import { ObjectPropertiesResponse } from './ObjectPropertiesResponse';

export class AuxiliarySensorPropertiesResponse extends ObjectPropertiesResponse {

  private readonly _state: number;
  private readonly _temperature: number;
  private readonly _lowSetPoint: number;
  private readonly _highSetPoint: number;
  private readonly _type: number;

  constructor(message: Buffer) {
    super(message, 11, 26);

    this._state = message[6];
    this._temperature = message[7];
    this._lowSetPoint = message[8];
    this._highSetPoint = message[9];
    this._type = message[10];
  }

  get state(): number {
    return this._state;
  }

  get temperature(): number {
    return this._temperature;
  }

  get lowSetPoint(): number {
    return this._lowSetPoint;
  }

  get highSetPoint(): number {
    return this._highSetPoint;
  }

  get type(): number {
    return this._type;
  }
}