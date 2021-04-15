import { ObjectPropertiesResponse } from './ObjectPropertiesResponse';

export enum SensorTypes {
  Temperature = 0,
  Humidity = 1,
  Other = 2
}

export class AuxiliarySensorPropertiesResponse extends ObjectPropertiesResponse {

  private _sensorType?: number;

  get sensorType(): SensorTypes {
    return this._sensorType === 84
      ? SensorTypes.Humidity
      : SensorTypes.Temperature;
  }

  deserialize(message: Buffer): void {
    super.deserialize(message);

    this._sensorType = message[10];
    this._name = this.getName(message.subarray(11, 26), 'Auxiliary');
  }
}