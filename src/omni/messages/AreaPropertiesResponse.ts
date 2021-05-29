import { ObjectPropertiesResponse } from './ObjectPropertiesResponse';
import { AreaStatus } from '../../models/AreaStatus';

export class AreaPropertiesResponse extends ObjectPropertiesResponse {

  private _status?: AreaStatus;
  private _enabled?: boolean;
  
  get status(): AreaStatus {
    return this._status!;
  }

  get enabled(): boolean {
    return this._enabled ?? false;
  }

  deserialize(message: Buffer): void {
    super.deserialize(message);

    this._status = new AreaStatus(message[6], message[7]);
    this._enabled = message[10] !== 0;
    this._name = this.getName(message.subarray(13, 25), 'Area');
  }
}