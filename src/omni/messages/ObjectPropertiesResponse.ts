import { ApplicationDataResponse } from './ApplicationDataResponse';

export abstract class ObjectPropertiesResponse extends ApplicationDataResponse {

  private _index?: number;
  protected _name?: string;
  
  get index(): number {
    return this._index!;
  }

  get name(): string {
    return this._name!;
  }

  deserialize(message: Buffer): void {
    super.deserialize(message);

    this._index = message[4] * 256 + message[5];
  }

  protected getName(nameBuffer: Buffer, type: string) {
    const name = nameBuffer.toString().replace(/[^ -~]+/g, '');

    return name.length === 0 ? `${type} ${this.index}` : name;
  }
}