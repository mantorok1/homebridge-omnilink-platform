import { ObjectPropertiesResponse } from './ObjectPropertiesResponse';
import { UnitTypes } from './enums';
import { UnitStatus } from '../../models/UnitStatus';

export class UnitPropertiesResponse extends ObjectPropertiesResponse {

  private _status?: UnitStatus;
  private _unitType?: UnitTypes;
  
  get status(): UnitStatus {
    return this._status!;
  }
  
  get unitType(): UnitTypes {
    return this._unitType!;
  }

  deserialize(message: Buffer): void {
    super.deserialize(message);

    this._status = new UnitStatus(message[6]);
    this._unitType = message[9];
    this._name = this.getName(message.subarray(10, 22), 'Unit');
  }
}