import { ApplicationDataResponse } from './ApplicationDataResponse';
import { ZoneStatus } from '../../models/ZoneStatus';

export class ExtendedZoneStatusResponse extends ApplicationDataResponse {

  private _zones!: Map<number, ZoneStatus>;

  get zones(): Map<number, ZoneStatus> {
    return this._zones;
  }

  deserialize(message: Buffer): void {
    super.deserialize(message);

    this._zones = new Map<number, ZoneStatus>();
    const zoneCount = (message[1] - 3) / 4;

    for(let i = 1; i <= zoneCount; i++) {
      const startPos = (i - 1) * 4 + 5;
      const zoneId = message[startPos] * 256 + message[startPos + 1];
      const status = new ZoneStatus(message[startPos + 2]);
      this._zones.set(zoneId, status);
    }
  }
}