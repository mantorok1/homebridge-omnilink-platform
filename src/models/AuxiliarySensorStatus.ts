import { util } from './util';

export class AuxiliarySensorStatus {
  private readonly _temperature: number;
  private readonly _humidity: number;

  constructor(omniTemperature: number) {
    this._temperature = util.convertToCelcius(omniTemperature);
    this._humidity = util.convertToHumidity(omniTemperature);  
  }

  get temperature(): number {
    return this._temperature;
  }

  get humidity(): number {
    return this._humidity;
  }
}