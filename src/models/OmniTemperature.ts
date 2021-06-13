import { TemperatureFormats } from './SystemFormats';


export class OmniTemperature {
  constructor(private omniTemperature: number, private format?: TemperatureFormats) {
  }

  equals(temperature : OmniTemperature | undefined): boolean {
    return temperature === undefined
      ? false
      : this.value === temperature.value;
  }

  static fromCelcius(temperature: number): number {
    return (40 + temperature) * 2;
  }

  static fromFahrenheit(temperature: number): number {
    return Math.round((40 + temperature) / 229.5 * 255);
  }

  static fromPercentage(humidity: number): number {
    if (humidity <= 0) {
      return 44;
    } else if (humidity >= 100) {
      return 156;
    } else {
      return 44 + Math.round(humidity / 100.0 * 112.0);
    }
  }

  get value(): number {
    return this.omniTemperature;
  }

  toCelcius(): number {
    return -40.0 + (this.omniTemperature / 2.0);
  }

  toFahrenheit(): number {
    return -40.0 + (Math.round((this.omniTemperature / 255.0 * 229.5) * 10.0) / 10.0);
  }

  toPercentage(): number {
    return Math.max(0, Math.min(100, this.toFahrenheit()));
  }

  toFormat(): number {
    switch(this.format) {
      case TemperatureFormats.Fahrenheit:
        return this.toFahrenheit();
      case TemperatureFormats.Percentage:
        return this.toPercentage();
      default:
        return this.toCelcius();
    }
  }

  toString(): string {
    switch(this.format) {
      case TemperatureFormats.Fahrenheit:
        return `${this.toFahrenheit()}F`;
      case TemperatureFormats.Percentage:
        return `${this.toPercentage()}%`;
      default:
        return `${this.toCelcius()}C`;
    }
  }
}
