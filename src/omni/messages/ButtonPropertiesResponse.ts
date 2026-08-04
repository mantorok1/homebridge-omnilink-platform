import { ObjectPropertiesResponse } from './ObjectPropertiesResponse.js'

export class ButtonPropertiesResponse extends ObjectPropertiesResponse {
  constructor(message: Buffer) {
    super(message, 6, 18)
  }
}
