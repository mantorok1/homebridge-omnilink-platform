import { MessageTypes } from './enums';
import { Response } from './Response';

export abstract class ApplicationDataResponse extends Response {

  private _type?: number;

  get type(): MessageTypes {
    return this._type!;
  }

  deserialize(message: Buffer): void {
    this._type = message[2];
  }
}