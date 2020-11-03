import { ApplicationDataResponse } from './ApplicationDataResponse';
import { UnitStatus } from '../../models/UnitStatus';

export class ExtendedUnitStatusResponse extends ApplicationDataResponse {

  private _units!: Map<number, UnitStatus>;

  get units(): Map<number, UnitStatus> {
    return this._units;
  }

  deserialize(message: Buffer): void {
    super.deserialize(message);

    this._units = new Map<number, UnitStatus>();
    const unitCount = (message[1] - 3) / 5;

    for(let i = 1; i <= unitCount; i++) {
      const startPos = (i - 1) * 5 + 5;
      const unitId = message[startPos] * 256 + message[startPos + 1];
      const status = new UnitStatus(message[startPos + 2]);
      this._units.set(unitId, status);
    }
  }
}