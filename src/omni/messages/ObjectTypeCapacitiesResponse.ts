import { ObjectTypes } from './enums';
import { ApplicationDataResponse } from './ApplicationDataResponse';

export class ObjectTypeCapacitiesResponse extends ApplicationDataResponse {

  private _objectType?: number;
  private _capacity?: number;

  get objectType(): ObjectTypes {
    return this._objectType!;
  }

  get capacity(): number {
    return this._capacity ?? 0;
  }

  deserialize(message: Buffer): void {
    super.deserialize(message);

    this._objectType = message[3];
    this._capacity = message[4] * 256 + message[5];
  }
}