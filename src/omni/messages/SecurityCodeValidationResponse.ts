import { AuthorityLevels } from './enums';
import { ApplicationDataResponse } from './ApplicationDataResponse';

export class SecurityCodeValidationResponse extends ApplicationDataResponse {

  private _codeId?: number;
  private _authorityLevel?: number;

  get codeId(): number {
    return this._codeId!;
  }

  get authorityLevel(): AuthorityLevels {
    return this._authorityLevel!;
  }

  deserialize(message: Buffer): void {
    super.deserialize(message);

    this._codeId = message[3];
    this._authorityLevel = message[4];
  }
}