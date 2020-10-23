import { ApplicationDataResponse } from './ApplicationDataResponse';
import { AreaStatus } from '../../models/AreaStatus';

export class ExtendedAreaStatusResponse extends ApplicationDataResponse {

  private _areas!: Map<number, AreaStatus>;

  get areas(): Map<number, AreaStatus> {
    return this._areas;
  }

  deserialize(message: Buffer): void {
    super.deserialize(message);

    this._areas = new Map<number, AreaStatus>();
    const areaCount = (message[1] - 3) / 6;

    for(let i = 1; i <= areaCount; i++) {
      const startPos = (i - 1) * 6 + 5;
      const areaId = message[startPos] * 256 + message[startPos + 1];
      const status = new AreaStatus(message[startPos + 2], message[startPos + 3]);
      this._areas.set(areaId, status);
    }
  }
}