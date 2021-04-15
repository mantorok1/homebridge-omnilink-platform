import { ApplicationDataResponse } from './ApplicationDataResponse';
import { AuxiliarySensorStatus } from '../../models/AuxiliarySensorStatus';

export class ExtendedAuxiliarySensorStatusResponse extends ApplicationDataResponse {

  private _sensors!: Map<number, AuxiliarySensorStatus>;

  get sensors(): Map<number, AuxiliarySensorStatus> {
    return this._sensors;
  }

  deserialize(message: Buffer): void {
    super.deserialize(message);

    this._sensors = new Map<number, AuxiliarySensorStatus>();
    const sensorCount = (message[1] - 3) / 6;

    for(let i = 1; i <= sensorCount; i++) {
      const startPos = (i - 1) * 6 + 5;
      const sensorId = message[startPos] * 256 + message[startPos + 1];
      const temperatureHumidity = message[startPos + 3];
      const sensor = new AuxiliarySensorStatus(temperatureHumidity);
      this._sensors.set(sensorId, sensor);
    }
  }
}