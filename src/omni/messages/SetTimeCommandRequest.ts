import { MessageTypes } from './enums';
import { ApplicationDataRequest } from './ApplicationDataRequest';

type SetTimeCommandRequestArgs = {
  year: number,
  month: number,
  day: number,
  dayOfWeek: number,
  hour: number,
  minute: number,
  daylightSavings: number
}

export class SetTimeCommandRequest extends ApplicationDataRequest {

  private readonly type = MessageTypes.SetTimeCommandRequest;

  constructor(args: SetTimeCommandRequestArgs) {
    super();
    this.year = args.year;
    this.month = args.month;
    this.day = args.day;
    this.dayOfWeek = args.dayOfWeek;
    this.hour = args.hour;
    this.minute = args.minute;
    this.daylightSavings = args.daylightSavings;
  }

  year = 0;
  month = 0;
  day = 0;
  dayOfWeek = 0;
  hour = 0;
  minute = 0;
  daylightSavings = 0;

  get data(): Buffer {
    return Buffer.from([this.type, this.year, this.month, this.day, this.dayOfWeek,
      this.hour, this.minute, this.daylightSavings]);
  }
}