import { Request } from './Request';

export abstract class ApplicationDataRequest extends Request {

  private startCharacter = 0x21;

  abstract get data(): Buffer;

  serialize(): Buffer {
    return Buffer.concat([Buffer.from([this.startCharacter, this.data.length]), this.data]);
  }
}
