import { ObjectPropertiesResponse } from './ObjectPropertiesResponse';

export enum ZoneTypes {
  FireEmergency = 33,
}

export class ZonePropertiesResponse extends ObjectPropertiesResponse {

  private _zoneType?: number;
  private _areaId?: number;
  
  get zoneType(): number {
    return this._zoneType!;
  }

  get areaId(): number {
    return this._areaId!;
  }

  deserialize(message: Buffer): void {
    super.deserialize(message);

    this._zoneType = message[8];
    this._areaId = message[9];
    this._name = this.getName(message.subarray(11, 26), 'Zone');
  }
}