import { Response } from './Response';

export class SecureConnectionResponse extends Response {

  private _sessionId?: Buffer;

  get sessionId(): Buffer {
    return this._sessionId!;
  }

  deserialize(message: Buffer): void {
    this._sessionId = message.subarray(0, 5);
  }
}