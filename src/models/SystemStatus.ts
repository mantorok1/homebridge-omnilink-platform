
export enum Days {
  Monday = 1,
  Tuesday = 2,
  Wednesday = 3,
  Thursday = 4,
  Friday = 5,
  Saturday = 6,
  Sunday = 7
}

interface SystemStatusArgs {
  timeDateValid: number,
  year: number,
  month: number,
  day: number,
  dayOfWeek: number,
  hour: number,
  minute: number,
  second: number,
  daylightSavingsTime: number,
  sunriseHour: number,
  sunriseMinute: number,
  sunsetHour: number,
  sunsetMinute: number,
  batteryReading: number
}

export class SystemStatus {
  private readonly _dateTimeValid: boolean;
  private readonly _dateTime: Date;
  private readonly _dayOfWeek: Days;
  private readonly _daylightSavingsTime: boolean;
  private readonly _sunriseTime: Date;
  private readonly _sunsetTime: Date;
  private readonly _batteryReading: number;

  constructor(args: SystemStatusArgs) {
    this._dateTimeValid = args.timeDateValid === 1;
    this._dateTime = new Date(args.year + 2000, args.month - 1, args.day, args.hour, args.minute, args.second);
    this._dayOfWeek = args.dayOfWeek;
    this._daylightSavingsTime = args.daylightSavingsTime === 1;
    this._sunriseTime = new Date(args.year + 2000, args.month - 1, args.day, args.sunriseHour, args.sunriseMinute, 0);
    this._sunsetTime = new Date(args.year + 2000, args.month - 1, args.day, args.sunsetHour, args.sunsetMinute, 0);
    this._batteryReading = args.batteryReading;
  }

  get dateTimeValid(): boolean {
    return this._dateTimeValid;
  }

  get dateTime(): Date {
    return this._dateTime;
  }

  get dayOfWeek(): Days {
    return this._dayOfWeek;
  }

  get daylightSavingsTime(): boolean {
    return this._daylightSavingsTime;
  }

  get sunriseTime(): Date {
    return this._sunriseTime;
  }

  get sunsetTime(): Date {
    return this._sunsetTime;
  }

  get batteryReading(): number {
    return this._batteryReading;
  }
}