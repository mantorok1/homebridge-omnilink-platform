import { ObjectPropertiesResponse } from './ObjectPropertiesResponse';
import { UnitTypes } from './enums';

export class UnitPropertiesResponse extends ObjectPropertiesResponse {

  private _unitState?: number;
  private _unitTime?: number;
  private _unitType?: UnitTypes;
  
  get unitState(): number {
    return this._unitState!;
  }
  
  get unitTime(): number {
    return this._unitTime!;
  }
  
  get unitType(): UnitTypes {
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