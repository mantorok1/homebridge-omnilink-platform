import { ObjectTypes } from './enums';
import { ApplicationDataResponse } from './ApplicationDataResponse';

export class ObjectTypeCapacitiesResponse extends ApplicationDataResponse {

  private _objectType?: number;
  private _capcity?: number;

  get objectType(): ObjectTypes {
    return this._objectType!;
  }

  get capcity(): number {
    return this._capcity!;
  }

  deserialize(message: Buffer): void {
    super.deserialize(message);

    this._objectType = message[3];
    this._capcity = message[4] * 256 + message[5];
  }
}