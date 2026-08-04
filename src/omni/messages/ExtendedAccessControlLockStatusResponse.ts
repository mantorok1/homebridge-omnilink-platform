import { ApplicationDataResponse } from './ApplicationDataResponse.js'

export class ExtendedAccessControlLockStatusResponse extends ApplicationDataResponse {
  private _id: number[] = []
  private _lockState: number[] = []
  private _unlockTimer: number[] = []

  constructor(message: Buffer) {
    super(message)

    const recordLength = message[4]
    const lockCount = (message[1] - 3) / recordLength
    let offset = 5
    for (let i = 1; i <= lockCount; i++) {
      this._id.push(message.readUInt16BE(offset))
      this._lockState.push(message[offset + 2])
      this._unlockTimer.push(message.readUInt16BE(offset + 3))
      offset += recordLength
    }
  }

  get id(): number[] {
    return this._id
  }

  get lockState(): number[] {
    return this._lockState
  }

  get unlockTimer(): number[] {
    return this._unlockTimer
  }
}
