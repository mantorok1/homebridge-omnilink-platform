export enum TemperatureFormats {
  Fahrenheit = 1,
  Celsius = 2,
  Percentage = 3
}

export enum TimeFormats {
  TwelveHour = 1,
  TwentyFourHour = 2,
}

export enum DateFormats {
  MonthDay = 1,
  DayMonth = 2,
}

interface SystemFormatsArgs {
  temperature: number,
  time: number,
  date: number
}

export class SystemFormats {
  private readonly _temperature: TemperatureFormats;
  private readonly _time: TimeFormats;
  private readonly _date: DateFormats;

  constructor(args: SystemFormatsArgs) {
    this._temperature = args.temperature;
    this._time = args.time;
    this._date = args.date;
  }

  get temperature(): TemperatureFormats {
    return this._temperature;
  }

  get time(): TimeFormats {
    return this._time;
  }

  get dateFormat(): DateFormats {
    return this._date;
  }

}