import { MessageTypes, ObjectTypes } from './enums';
import { ApplicationDataRequest } from './ApplicationDataRequest';

type ObjectTypeCapacitiesRequestArgs = {
  objectType: ObjectTypes
}

export class ObjectTypeCapacitiesRequest extends ApplicationDataRequest {

  private readonly type = MessageTypes.ObjectTypeCapacitiesRequest;

  constructor(args: ObjectTypeCapacitiesRequestArgs) {
    super();
    this.objectType = args.objectType;
  }

  objectType: ObjectTypes;

  get data(): Buffer {
    return Buffer.from([this.type, this.objectType]);
  }
}