import { Request } from './Request.js'

export class SecureConnectionRequest extends Request {
  constructor(public readonly sessionId: Buffer) {
    super()
  }

  serialize(): Buffer {
    return this.sessionId
  }
}
