export class util {
  static convertToCelcius(omniTemperature: number): number {
    return -40.0 + (omniTemperature / 2.0);
  }

  static convertToFahrenheit(omniTemperature: number): number {
    return -40.0 + (Math.round((omniTemperature / 255.0 * 229.5) * 10.0) / 10.0);
  }

  // Humidity is reported in Omni temperature format (0-100 F => 0-100%)
  static convertToHumidity(omniTemperature: number): number {
    if (omniTemperature <= 44) {
      return 0;
    } else if (omniTemperature >= 156) {
      return 100;
    } else {
      return -40 + Math.round(omniTemperature / 255.0 * 229.5);
    }
  }
}