import { ObjectPropertiesResponse } from './ObjectPropertiesResponse';

export class ZonePropertiesResponse extends ObjectPropertiesResponse {
  private _state: number;
  private _loopReading: number;
  private _type: number;
  private _areaId: number;
  private _options: number;

  constructor(message: Buffer) {
    super(message, 11, 26);
    this._state = message[6];
    this._loopReading = message[7];
    this._type = message[8];
    this._areaId = message[9];
    this._options = message[10];
  }

  get state(): number {
    return this._state;
  }

  get loopReading(): number {
    return this._loopReading;
  }
  
  get type(): number {
    return this._type;
  }

  get areaId(): number {
    return this._areaId;
  }

  get options(): number {
    return this._options;
  }
}