import type { ObjectStatusTypes } from './enums.js'

import { ApplicationDataRequest } from './ApplicationDataRequest.js'
import { MessageTypes } from './enums.js'

interface ExtendedObjectStatusRequestArgs {
  statusType: ObjectStatusTypes
  startId: number
  endId: number
}

export class ExtendedObjectStatusRequest extends ApplicationDataRequest {
  private readonly type = MessageTypes.ExtendedObjectStatusRequest

  constructor(args: ExtendedObjectStatusRequestArgs) {
    super()
    this.statusType = args.statusType
    this.startId = args.startId
    this.endId = args.endId
  }

  statusType: ObjectStatusTypes
  startId = 0
  endId = 0

  get data(): Buffer {
    return Buffer.from([
      this.type,
      this.statusType,
      this.msb(this.startId),
      this.lsb(this.startId),
      this.msb(this.endId),
      this.lsb(this.endId),
    ])
  }
}
