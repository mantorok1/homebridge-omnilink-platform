import { ApplicationDataResponse } from './ApplicationDataResponse';

export abstract class ObjectPropertiesResponse extends ApplicationDataResponse {

  private _index: number;
  protected _name?: string;

  constructor(message: Buffer, nameStart: number, nameEnd: number) {
    super(message);
    this._index = message.readUInt16BE(4);
    this._name = message.toString('utf8', nameStart, nameEnd).replace(/[^ -~]+/g, '');
  }
  
  get index(): number {
    return this._index;
  }

  get name(): string {
    return this._name!;
  }
}