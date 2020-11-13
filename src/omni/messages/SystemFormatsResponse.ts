import { ApplicationDataResponse } from './ApplicationDataResponse';

export enum TemperatureFormats {
  Fahrenheit = 1,
  Celsius = 2,
}

export enum TimeFormats {
  TwelveHour = 1,
  TwentyFourHour = 2,
}

export enum DateFormats {
  MonthDay = 1,
  DayMonth = 2,
}

export class SystemFormatsResponse extends ApplicationDataResponse {

  private _temperatureFormat?: TemperatureFormats;
  private _timeFormat?: TimeFormats;
  private _dateFormat?: DateFormats;


  get temperatureFormat(): TemperatureFormats {
    return this._temperatureFormat!;
  }

  get timeFormat(): TimeFormats {
    return this._timeFormat!;
  }

  get dateFormat(): DateFormats {
    return this._dateFormat!;
  }

  deserialize(message: Buffer): void {
    super.deserialize(message);

    this._temperatureFormat = message[3];
    this._timeFormat = message[4];
    this._dateFormat = message[5];
  }
}