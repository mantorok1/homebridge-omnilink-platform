import type { AuthorityLevels } from './enums.js'

import { ApplicationDataResponse } from './ApplicationDataResponse.js'

export class SecurityCodeValidationResponse extends ApplicationDataResponse {
  private readonly _codeId: number
  private readonly _authorityLevel: number

  constructor(message: Buffer) {
    super(message)
    this._codeId = message[3]
    this._authorityLevel = message[4]
  }

  get codeId(): number {
    return this._codeId!
  }

  get authorityLevel(): AuthorityLevels {
    return this._authorityLevel!
  }
}
