import { ApplicationDataRequest } from './ApplicationDataRequest.js'
import { MessageTypes } from './enums.js'

export class SystemStatusRequest extends ApplicationDataRequest {
  private readonly type = MessageTypes.SystemStatusRequest

  constructor() {
    super()
  }

  get data(): Buffer {
    return Buffer.from([this.type])
  }
}
