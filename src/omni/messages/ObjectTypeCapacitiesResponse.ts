import { ObjectTypes } from './enums';
import { ApplicationDataResponse } from './ApplicationDataResponse';

export class ObjectTypeCapacitiesResponse extends ApplicationDataResponse {

  private readonly _objectType: number;
  private readonly _capacity: number;

  constructor(message: Buffer) {
    super(message);
    this._objectType = message[3];
    this._capacity = message.readUInt16BE(4);
  }

  get objectType(): ObjectTypes {
    return this._objectType;
  }

  get capacity(): number {
    return this._capacity;
  }
}