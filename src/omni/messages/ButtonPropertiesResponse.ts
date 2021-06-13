import { ObjectPropertiesResponse } from './ObjectPropertiesResponse';

export class ButtonPropertiesResponse extends ObjectPropertiesResponse {

  constructor(message: Buffer) {
    super(message, 6, 18);
  }
}