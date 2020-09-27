import { Request } from './Request';

export class SecureConnectionRequest extends Request {

  constructor(public readonly sessionId: Buffer) {
    super();
  }
  
  serialize(): Buffer {
    return this.sessionId;
  }
}