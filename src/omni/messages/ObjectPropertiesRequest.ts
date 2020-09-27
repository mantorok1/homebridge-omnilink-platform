import { MessageTypes, ObjectTypes } from './enums';
import { ApplicationDataRequest } from './ApplicationDataRequest';

type ObjectPropertiesRequestArgs = {
  objectType: ObjectTypes,
  index: number,
  relativeDirection: number,
  filter1: number,
  filter2: number,
  filter3: number
}

export class ObjectPropertiesRequest extends ApplicationDataRequest {

  private readonly type = MessageTypes.ObjectPropertiesRequest;

  constructor(args: ObjectPropertiesRequestArgs) {
    super();
    this.objectType = args.objectType;
    this.index = args.index;
    this.relativeDirection = args.relativeDirection;
    this.filter1 = args.filter1;
    this.filter2 = args.filter2;
    this.filter3 = args.filter3;
  }

  objectType: ObjectTypes = 0;
  index = 0;
  relativeDirection = 0;
  filter1 = 0;
  filter2 = 0;
  filter3 = 0;

  get data(): Buffer {
    return Buffer.from([
      this.type, this.objectType, this.msb(this.index), this.lsb(this.index),
      this.relativeDirection, this.filter1, this.filter2, this.filter3,
    ]);
  }
}