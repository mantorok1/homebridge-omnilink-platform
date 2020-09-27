import { SecurityModes } from './enums';
import { ObjectPropertiesResponse } from './ObjectPropertiesResponse';

export class AreaPropertiesResponse extends ObjectPropertiesResponse {

  private _mode?: number;
  private _alarms?: number;
  private _enabled?: boolean;
  
  get mode(): SecurityModes {
    return this._mode!;
  }

  get alarms(): number {
    return this._alarms!;
  }

  get enabled(): boolean {
    return this._enabled ?? false;
  }

  deserialize(message: Buffer): void {
    super.deserialize(message);

    this._mode = message[6];
    this._alarms = message[7];
    this._enabled = message[10] !== 0;
    this._name = this.getName(message.subarray(13, 25), 'Area');
  }
}