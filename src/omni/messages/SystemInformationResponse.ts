import { ApplicationDataResponse } from './ApplicationDataResponse';

export class SystemInformationResponse extends ApplicationDataResponse {

  private readonly _modelNumber: number;
  private readonly _majorVersion: number;
  private readonly _minorVersion: number;
  private readonly _revision: number;
  private readonly _localPhoneNumber: string;

  constructor(message: Buffer) {
    super(message);

    this._modelNumber = message[3];
    this._majorVersion = message[4];
    this._minorVersion = message[5];
    this._revision = message[6];
    this._localPhoneNumber = message.toString('utf8', 7, 31).replace(/[^ -~]+/g, '');
  }

  get modelNumber(): number {
    return this._modelNumber;
  }

  get majorVersion(): number {
    return this._majorVersion;
  }

  get minorVersion(): number {
    return this._minorVersion;
  }

  get revision(): number {
    return this._revision;
  }

  get localPhoneNumber(): string {
    return this._localPhoneNumber;
  }
}