import { ApplicationDataResponse } from './ApplicationDataResponse';

export class SystemStatusResponse extends ApplicationDataResponse {

  private _dateTime?: Date;
  private _isDaylightSavings?: boolean;

  get dateTime(): Date {
    return this._dateTime!;
  }

  get isDaylightSavings(): boolean {
    return this._isDaylightSavings!;
  }

  deserialize(message: Buffer): void {
    super.deserialize(message);

    const year = message[4] + 2000;
    const month = message[5] - 1;
    const day = message[6];
    const hour = message[8];
    const minute = message[9];
    const second = message[10];

    this._dateTime = new Date(year, month, day, hour, minute, second);
    this._isDaylightSavings = message[11] !== 0;
  }
}