import { ObjectPropertiesResponse } from './ObjectPropertiesResponse';

export enum ThermostatTypes {
  NotUsed = 0,
  AutoHeatCool = 1,
  HeatCool = 2,
  Heat = 3,
  Cool = 4,
  SetPoiont = 5
}

export class ThermostatPropertiesResponse extends ObjectPropertiesResponse {

  private _thermostatType?: ThermostatTypes;
  
  get thermostatType(): ThermostatTypes {
    return this._thermostatType!;
  }

  deserialize(message: Buffer): void {
    super.deserialize(message);

    this._thermostatType = message[13];
    this._name = this.getName(message.subarray(14, 26), 'Thermostat');
  }
}