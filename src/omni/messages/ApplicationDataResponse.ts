import type { MessageTypes } from './enums.js'

import { Response } from './Response.js'

export abstract class ApplicationDataResponse extends Response {
  private _messageType: number

  constructor(message: Buffer) {
    super(message)
    this._messageType = message[2]
  }

  get messageType(): MessageTypes {
    return this._messageType!
  }
}
