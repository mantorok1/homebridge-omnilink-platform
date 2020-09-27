import { MessageTypes } from './enums';
import { ApplicationDataRequest } from './ApplicationDataRequest';

export class SystemInformationRequest extends ApplicationDataRequest {

  private readonly type = MessageTypes.SystemInformationRequest;

  constructor() {
    super();
  }

  get data(): Buffer {
    return Buffer.from([this.type]);
  }
}