import { ApplicationDataResponse } from './ApplicationDataResponse';

export type ExtendedAreaStatus = {
  mode: number,
  alarms: number
}

export class ExtendedAreaStatusResponse extends ApplicationDataResponse {

  private _areas!: Map<number, ExtendedAreaStatus>;

  get areas(): Map<number, ExtendedAreaStatus> {
    return this._areas;
  }

  deserialize(message: Buffer): void {
    super.deserialize(message);

    this._areas = new Map<number, ExtendedAreaStatus>();
    const areaCount = (message[1] - 3) / 6;

    for(let i = 1; i <= areaCount; i++) {
      const startPos = (i - 1) * 6 + 5;
      const areaId = message[startPos] * 256 + message[startPos + 1];
      const status: ExtendedAreaStatus = {
        mode: message[startPos + 2],
        alarms: message[startPos + 3],
      };
      this._areas.set(areaId, status);
    }
  }
}