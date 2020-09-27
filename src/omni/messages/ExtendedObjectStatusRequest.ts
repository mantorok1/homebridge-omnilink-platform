import { MessageTypes, ObjectTypes } from './enums';
import { ApplicationDataRequest } from './ApplicationDataRequest';

type ExtendedObjectStatusRequestArgs = {
  objectType: ObjectTypes,
  startId: number,
  endId: number
}

export class ExtendedObjectStatusRequest extends ApplicationDataRequest {

  private readonly type = MessageTypes.ExtendedObjectStatusRequest;

  constructor(args: ExtendedObjectStatusRequestArgs) {
    super();
    this.objectType = args.objectType;
    this.startId = args.startId;
    this.endId = args.endId;
  }

  objectType: ObjectTypes = 0;
  startId = 0;
  endId = 0;

  get data(): Buffer {
    return Buffer.from([
      this.type, this.objectType, this.msb(this.startId), this.lsb(this.startId),
      this.msb(this.endId), this.lsb(this.endId),
    ]);
  }
}