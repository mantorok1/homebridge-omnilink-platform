import { ApplicationDataRequest } from './ApplicationDataRequest.js'
import { MessageTypes } from './enums.js'

export class SystemInformationRequest extends ApplicationDataRequest {
  private readonly type = MessageTypes.SystemInformationRequest

  constructor() {
    super()
  }

  get data(): Buffer {
    return Buffer.from([this.type])
  }
}
