import { MessageTypes } from './enums';
import { ApplicationDataRequest } from './ApplicationDataRequest';

export class SystemStatusRequest extends ApplicationDataRequest {

  private readonly type = MessageTypes.SystemStatusRequest;

  constructor() {
    super();
  }

  get data(): Buffer {
    return Buffer.from([this.type]);
  }
}