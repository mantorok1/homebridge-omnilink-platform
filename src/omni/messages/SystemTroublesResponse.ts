import { ApplicationDataResponse } from './ApplicationDataResponse';

export class SystemTroublesResponse extends ApplicationDataResponse {

  private _troubles: number[] = [];

  constructor(message: Buffer) {
    super(message);

    const troubleCount = message[1] - 1;
    for(let i = 0; i < troubleCount; i++) {
      this._troubles.push(message[i + 3]);
    }
  }

  get troubles(): number[] {
    return this._troubles;
  }
}