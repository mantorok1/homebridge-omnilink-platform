import { ObjectPropertiesResponse } from './ObjectPropertiesResponse';

export class AudioSourcePropertiesResponse extends ObjectPropertiesResponse {

  constructor(message: Buffer) {
    super(message, 6, 18);
  }
}