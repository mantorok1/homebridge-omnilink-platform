import { Response } from './Response';

export class SecureConnectionResponse extends Response {

  private readonly _sessionId: Buffer;

  constructor(message: Buffer) {
    super(message);

    this._sessionId = message.subarray(0, 5);
  }

  get sessionId(): Buffer {
    return this._sessionId;
  }
}