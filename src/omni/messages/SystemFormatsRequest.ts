import { ApplicationDataRequest } from './ApplicationDataRequest.js'
import { MessageTypes } from './enums.js'

export class SystemFormatsRequest extends ApplicationDataRequest {
  private readonly type = MessageTypes.SystemFormatsRequest

  constructor() {
    super()
  }

  get data(): Buffer {
    return Buffer.from([this.type])
  }
}
