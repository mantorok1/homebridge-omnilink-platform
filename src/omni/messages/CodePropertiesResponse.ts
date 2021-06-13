import { ObjectPropertiesResponse } from './ObjectPropertiesResponse';

export class CodePropertiesResponse extends ObjectPropertiesResponse {

  constructor(message: Buffer) {
    super(message, 6, 18);
  }
}