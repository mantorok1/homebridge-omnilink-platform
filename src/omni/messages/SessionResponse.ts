import { Response } from './Response';

export class SessionResponse extends Response {

  private readonly _version: Buffer;
  private readonly _sessionId: Buffer;

  constructor(message: Buffer) {
    super(message);

    this._version = message.subarray(0, 1);
    this._sessionId = message.subarray(2, 7);
  }

  get version(): Buffer {
    return this._version;
  }

  get sessionId(): Buffer {
    return this._sessionId;
  }
}