import { IStatus } from './IStatus';
import { util } from './util';

export class AuxiliarySensorStatus implements IStatus {
  public readonly statusBuffer: Buffer;
  private readonly _temperature: number;
  private readonly _temperatureF: number;
  private readonly _humidity: number;

  constructor(omniTemperature: number) {
    this.statusBuffer = Buffer.from([omniTemperature]);
    this._temperature = util.convertToCelcius(omniTemperature);
    this._temperatureF = util.convertToFahrenheit(omniTemperature);
    this._humidity = util.convertToHumidity(omniTemperature);  
  }

  static getKey(sensorId: number): string {
    return `sensor-${sensorId}`;
  }

  equals(status: AuxiliarySensorStatus | undefined): boolean {
    return status === undefined
      ? false
      : (this.statusBuffer.equals(status.statusBuffer));
  }

  getKey(id: number): string {
    return AuxiliarySensorStatus.getKey(id);
  }

  get temperature(): number {
    return this._temperature;
  }

  get humidity(): number {
    return this._humidity;
  }
}