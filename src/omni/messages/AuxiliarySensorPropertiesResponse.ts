import { ObjectPropertiesResponse } from './ObjectPropertiesResponse';
import { AuxiliarySensorTypes } from './enums';
import { AuxiliarySensorStatus } from '../../models/AuxiliarySensorStatus';

export class AuxiliarySensorPropertiesResponse extends ObjectPropertiesResponse {

  private _status?: AuxiliarySensorStatus;
  private _sensorType?: AuxiliarySensorTypes;

  get status(): AuxiliarySensorStatus {
    return this._status!;
  }

  get sensorType(): AuxiliarySensorTypes {
    return this._sensorType!;
  }

  get isTemperatureSensor(): boolean {
    return this.sensorType! !== AuxiliarySensorTypes.Humidity;
  }

  deserialize(message: Buffer): void {
    super.deserialize(message);

    this._status = new AuxiliarySensorStatus(message[7]);
    this._sensorType = message[10];
    this._name = this.getName(message.subarray(11, 26), 'Auxiliary');
  }
}