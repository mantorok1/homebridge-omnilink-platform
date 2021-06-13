import { ApplicationDataResponse } from './ApplicationDataResponse';

export class SystemStatusResponse extends ApplicationDataResponse {

  private readonly _timeDateValid: number;
  private readonly _year: number;
  private readonly _month: number;
  private readonly _day: number;
  private readonly _dayOfWeek: number;
  private readonly _hour: number;
  private readonly _minute: number;
  private readonly _second: number;
  private readonly _daylightSavingsTime: number;
  private readonly _sunriseHour: number;
  private readonly _sunriseMinute: number;
  private readonly _sunsetHour: number;
  private readonly _sunsetMinute: number;
  private readonly _batteryReading: number;

  constructor(message: Buffer) {
    super(message);

    this._timeDateValid = message[3];
    this._year = message[4];
    this._month = message[5];
    this._day = message[6];
    this._dayOfWeek = message[7];
    this._hour = message[8];
    this._minute = message[9];
    this._second = message[10];
    this._daylightSavingsTime = message[11];
    this._sunriseHour = message[12];
    this._sunriseMinute = message[13];
    this._sunsetHour = message[14];
    this._sunsetMinute = message[15];
    this._batteryReading = message[16];
  }

  get timeDateValid(): number {
    return this._timeDateValid;
  }

  get year(): number {
    return this._year;
  }
  
  get month(): number {
    return this._month;
  }
  
  get day(): number {
    return this._day;
  }
  
  get dayOfWeek(): number {
    return this._dayOfWeek;
  }
  
  get hour(): number {
    return this._hour;
  }
  
  get minute(): number {
    return this._minute;
  }
  
  get second(): number {
    return this._second;
  }
  
  get daylightSavingsTime(): number {
    return this._daylightSavingsTime;
  }
  
  get sunriseHour(): number {
    return this._sunriseHour;
  }
  
  get sunriseMinute(): number {
    return this._sunriseMinute;
  }
  
  get sunsetHour(): number {
    return this._sunsetHour;
  }
  
  get sunsetMinute(): number {
    return this._sunsetMinute;
  }
  
  get batteryReading(): number {
    return this._batteryReading;
  }
}