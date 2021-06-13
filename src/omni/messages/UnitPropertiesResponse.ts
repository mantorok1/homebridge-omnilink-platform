import { ObjectPropertiesResponse } from './ObjectPropertiesResponse';

export class UnitPropertiesResponse extends ObjectPropertiesResponse {
  private _state: number;
  private _timeRemaining: number;
  private _type: number;

  constructor(message: Buffer) {
    super(message, 10, 22);

    this._state = message[6];
    this._timeRemaining = message.readUInt16BE(7);
    this._type = message[9];
  }
  
  get state(): number {
    return this._state;
  }

  get timeRemaining(): number {
    return this._timeRemaining;
  }

  get type(): number {
    return this._type;
  }
}