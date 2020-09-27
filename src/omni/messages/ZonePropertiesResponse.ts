import { ObjectPropertiesResponse } from './ObjectPropertiesResponse';

export enum ZoneTypes {
  FireEmergency = 33,
}

export class ZonePropertiesResponse extends ObjectPropertiesResponse {

  private _zoneType?: number;
  
  get zoneType(): number {
    return this._zoneType!;
  }

  deserialize(message: Buffer): void {
    super.deserialize(message);

    this._zoneType = message[8];
    this._name = this.getName(message.subarray(11, 26), 'Zone');
  }
}