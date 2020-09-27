import { MessageTypes } from './enums';
import { ApplicationDataRequest } from './ApplicationDataRequest';

type SecurityCodeValidationRequestArgs = {
  areaId: number,
  code: string
}

export class SecurityCodeValidationRequest extends ApplicationDataRequest {

  private readonly type = MessageTypes.SecurityCodeValidationRequest;

  constructor(args: SecurityCodeValidationRequestArgs) {
    super();
    this.areaId = args.areaId;
    this.code = args.code.padEnd(4, '0');
  }

  areaId = 0;
  code = '';

  get data(): Buffer {
    return Buffer.from([
      this.type, this.areaId,
      parseInt(this.code.substr(0, 1)), parseInt(this.code.substr(1, 1)),
      parseInt(this.code.substr(2, 1)), parseInt(this.code.substr(3, 1)),
    ]);
  }
}