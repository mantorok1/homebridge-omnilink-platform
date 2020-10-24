import { MessageTypes } from './enums';
import { ApplicationDataRequest } from './ApplicationDataRequest';

export class SystemTroublesRequest extends ApplicationDataRequest {

  private readonly type = MessageTypes.SystemTroublesRequest;

  constructor() {
    super();
  }

  get data(): Buffer {
    return Buffer.from([this.type]);
  }
}