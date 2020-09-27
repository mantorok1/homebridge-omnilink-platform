import { MessageTypes } from './enums';
import { ApplicationDataRequest } from './ApplicationDataRequest';

export class EnableNotificationsRequest extends ApplicationDataRequest {

  private readonly type = MessageTypes.EnableNotificationsRequest;

  constructor(public enabled: boolean) {
    super();
  }

  get data(): Buffer {
    return Buffer.from([this.type, this.enabled ? 1 : 0]);
  }
}