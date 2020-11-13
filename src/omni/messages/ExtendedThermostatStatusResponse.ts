import { ApplicationDataResponse } from './ApplicationDataResponse';
import { ThermostatStatus } from '../../models/ThermostatStatus';

export class ExtendedThermostatStatusResponse extends ApplicationDataResponse {

  private _thermostats!: Map<number, ThermostatStatus>;

  get thermostats(): Map<number, ThermostatStatus> {
    return this._thermostats;
  }

  deserialize(message: Buffer): void {
    super.deserialize(message);

    this._thermostats = new Map<number, ThermostatStatus>();
    const thermostatCount = (message[1] - 3) / 14;

    for(let i = 1; i <= thermostatCount; i++) {
      const startPos = (i - 1) * 14 + 5;
      const thermostatId = message[startPos] * 256 + message[startPos + 1];
      const status = new ThermostatStatus(message[startPos + 3], message[startPos + 4], message[startPos + 5],
        message[startPos + 6], message[startPos + 13]);
      this._thermostats.set(thermostatId, status);
    }
  }
}