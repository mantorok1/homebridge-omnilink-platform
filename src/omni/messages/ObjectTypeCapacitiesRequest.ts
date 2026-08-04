import type { ObjectTypes } from './enums.js'

import { ApplicationDataRequest } from './ApplicationDataRequest.js'
import { MessageTypes } from './enums.js'

interface ObjectTypeCapacitiesRequestArgs {
  objectType: ObjectTypes
}

export class ObjectTypeCapacitiesRequest extends ApplicationDataRequest {
  private readonly type = MessageTypes.ObjectTypeCapacitiesRequest

  constructor(args: ObjectTypeCapacitiesRequestArgs) {
    super()
    this.objectType = args.objectType
  }

  objectType: ObjectTypes

  get data(): Buffer {
    return Buffer.from([this.type, this.objectType])
  }
}
