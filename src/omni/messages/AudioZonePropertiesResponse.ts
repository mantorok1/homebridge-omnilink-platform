import { ObjectPropertiesResponse } from './ObjectPropertiesResponse';

export class AudioZonePropertiesResponse extends ObjectPropertiesResponse {
  private _state: number;
  private _sourceId: number;
  private _volume: number;
  private _mute: number;

  constructor(message: Buffer) {
    super(message, 10, 22);
    this._state = message[6];
    this._sourceId = message[7];
    this._volume = message[8];
    this._mute = message[9];
  }

  get state(): number {
    return this._state;
  }

  get sourceId(): number {
    return this._sourceId;
  }
  
  get volume(): number {
    return this._volume;
  }

  get mute(): number {
    return this._mute;
  }
}