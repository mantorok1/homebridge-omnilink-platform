import { ObjectPropertiesResponse } from './ObjectPropertiesResponse';

export class CodePropertiesResponse extends ObjectPropertiesResponse {

  deserialize(message: Buffer): void {
    super.deserialize(message);

    this._name = this.getName(message.subarray(6, 18), 'Code');
  }
}