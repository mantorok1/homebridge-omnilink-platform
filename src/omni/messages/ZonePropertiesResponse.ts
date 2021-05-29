import { ObjectPropertiesResponse } from './ObjectPropertiesResponse';
import { ZoneTypes } from './enums';
import { ZoneStatus } from '../../models/ZoneStatus';

export class ZonePropertiesResponse extends ObjectPropertiesResponse {

  private _status?: ZoneStatus;
  private _zoneType?: ZoneTypes;
  private _areaId?: number;
  
  get status(): ZoneStatus {
    return this._status!;
  }

  get zoneType(): ZoneTypes {
    return this._zoneType!;
  }

  get areaId(): number {
    return this._areaId!;
  }

  deserialize(message: Buffer): void {
    super.deserialize(message);

    this._status = new ZoneStatus(message[6]);
    this._zoneType = message[8];
    this._areaId = message[9];
    this._name = this.getName(message.subarray(11, 26), 'Zone');
  }
}