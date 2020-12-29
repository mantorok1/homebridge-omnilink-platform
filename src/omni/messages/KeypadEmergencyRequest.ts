import { MessageTypes, EmergencyTypes } from './enums';
import { ApplicationDataRequest } from './ApplicationDataRequest';

type KeypadEmergencyRequestArgs = {
  areaId: number,
  emergencyType: EmergencyTypes
}

export class KeypadEmergencyRequest extends ApplicationDataRequest {

  private readonly type = MessageTypes.KeypadEmergencyRequest;

  constructor(args: KeypadEmergencyRequestArgs) {
    super();
    this.areaId = args.areaId;
    this.emergencyType = args.emergencyType;
  }

  areaId = 0;
  emergencyType = 0;

  get data(): Buffer {
    return Buffer.from([this.type, this.areaId, this.emergencyType]);
  }
}