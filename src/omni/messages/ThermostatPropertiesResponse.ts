import { ObjectPropertiesResponse } from './ObjectPropertiesResponse';
import { ThermostatTypes } from './enums';
import { ThermostatStatus } from '../../models/ThermostatStatus';

export class ThermostatPropertiesResponse extends ObjectPropertiesResponse {

  private _status?: ThermostatStatus;
  private _thermostatType?: ThermostatTypes;

  get status(): ThermostatStatus {
    return this._status!;
  }

  get thermostatType(): ThermostatTypes {
    return this._thermostatType!;
  }

  deserialize(message: Buffer): void {
    super.deserialize(message);

    this._status = new ThermostatStatus(message[7], message[8], message[9],
      message[10], message[31], message[27], message[28], message[29]);
    this._thermostatType = message[13];
    this._name = this.getName(message.subarray(14, 26), 'Thermostat');
  }
}