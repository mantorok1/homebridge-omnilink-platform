import { ObjectPropertiesResponse } from './ObjectPropertiesResponse';

//export enum ZoneTypes {
//  FireEmergency = 33,
//}

export class UnitPropertiesResponse extends ObjectPropertiesResponse {

  private _unitState?: number;
  private _unitTime?: number;
  private _unitType?: number;
  
  get unitState(): number {
    return this._unitState!;
  }
  
  get unitTime(): number {
    return this._unitTime!;
  }
  
  get unitType(): number {
    return this._unitType!;
  }

  deserialize(message: Buffer): void {
    super.deserialize(message);

    this._unitState = message[6];
    this._unitTime = message[7] * 256 + message[8];
    this._unitType = message[9];
    this._name = this.getName(message.subarray(10, 22), 'Unit');
  }
}