import { ApplicationDataRequest } from './ApplicationDataRequest.js'
import { MessageTypes } from './enums.js'

export class SystemTroublesRequest extends ApplicationDataRequest {
  private readonly type = MessageTypes.SystemTroublesRequest

  constructor() {
    super()
  }

  get data(): Buffer {
    return Buffer.from([this.type])
  }
}
