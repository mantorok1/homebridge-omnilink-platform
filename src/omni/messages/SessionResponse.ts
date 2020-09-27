import { Response } from './Response';

export class SessionResponse extends Response {
  private _version?: Buffer;
  private _sessionId?: Buffer;

  get version(): Buffer | undefined {
    return this._version;
  }

  get sessionId(): Buffer | undefined {
    return this._sessionId;
  }

  deserialize(message: Buffer) {
    this._version = message.subarray(0, 1);
    this._sessionId = message.subarray(2, 7);
  }
}