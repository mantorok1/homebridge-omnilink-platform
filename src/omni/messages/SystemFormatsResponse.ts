import { ApplicationDataResponse } from './ApplicationDataResponse';

export class SystemFormatsResponse extends ApplicationDataResponse {

  private readonly _temperature: number;
  private readonly _time: number;
  private readonly _date: number;

  constructor(message: Buffer) {
    super(message);
    this._temperature = message[3];
    this._time = message[4];
    this._date = message[5];
  }

  get temperature(): number {
    return this._temperature;
  }

  get time(): number {
    return this._time;
  }

  get date(): number {
    return this._date;
  }
}