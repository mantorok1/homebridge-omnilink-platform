export class AuxiliarySensorStatus {
  private readonly _temperature: number;
  private readonly _humidity: number;

  constructor(omniTemperature: number) {
    this._temperature = this.convertToCelcius(omniTemperature);
    this._humidity = this.convertToHumidity(omniTemperature);  
  }

  get temperature(): number {
    return this._temperature;
  }

  get humidity(): number {
    return this._humidity;
  }

  private convertToCelcius(omniTemperature: number): number {
    return -40.0 + (omniTemperature / 2.0);
  }

  // Humidity is reported in Omni temperature format (0-100 F => 0-100%)
  private convertToHumidity(omniTemperature: number): number {
    if (omniTemperature <= 44) {
      return 0;
    } else if (omniTemperature >= 156) {
      return 100;
    } else {
      return Math.round(-40.0 + (omniTemperature / 255.0 * 229.5));
    }
  }
}