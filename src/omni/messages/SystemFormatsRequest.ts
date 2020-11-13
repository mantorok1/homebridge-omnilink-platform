import { MessageTypes } from './enums';
import { ApplicationDataRequest } from './ApplicationDataRequest';

export class SystemFormatsRequest extends ApplicationDataRequest {

  private readonly type = MessageTypes.SystemFormatsRequest;

  constructor() {
    super();
  }

  get data(): Buffer {
    return Buffer.from([this.type]);
  }
}