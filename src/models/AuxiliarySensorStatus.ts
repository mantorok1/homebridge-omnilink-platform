export class AuxiliarySensorStatus {
  private readonly _temperature: number;
  private readonly _humidity: number;

  constructor(temperatureHumidity: number) {
    this._temperature = this.convertToCelcius(temperatureHumidity);
    this._humidity = this.convertToFahrenheit(temperatureHumidity); // Humidity is reported in Omni temperature format (0-100 F => 0-100%) 
  }

  get temperature(): number {
    return this._temperature;
  }

  get humidity(): number {
    return this._humidity;
  }

  private convertToCelcius(temperature: number): number {
    return -40.0 + (temperature / 2.0);
  }

  private convertToFahrenheit(humidity: number): number {
    return -40.0 + (humidity / 255.0 * 229.5);
  }
}