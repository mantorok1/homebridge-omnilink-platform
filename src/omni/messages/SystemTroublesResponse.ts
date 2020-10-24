import { ApplicationDataResponse } from './ApplicationDataResponse';
import { SystemTroubles } from './enums';

export class SystemTroublesResponse extends ApplicationDataResponse {

  private _troubles?: SystemTroubles[];

  get troubles(): SystemTroubles[] {
    return this._troubles!;
  }

  deserialize(message: Buffer): void {
    super.deserialize(message);

    this._troubles! = [];

    const troubles = message[1] - 1;

    for(let i = 0; i < troubles; i++) {
      switch(message[i + 3]) {
        case 1:
        case 7:
          if (!this._troubles.includes(SystemTroubles.Freeze)) {
            this._troubles.push(SystemTroubles.Freeze);
          }
          break;
        case 2:
        case 8:
          if (!this._troubles.includes(SystemTroubles.BatteryLow)) {
            this._troubles.push(SystemTroubles.BatteryLow);
          }
          break;
        case 3:
          if (!this._troubles.includes(SystemTroubles.ACPower)) {
            this._troubles.push(SystemTroubles.ACPower);
          }
          break;
        case 4:
          if (!this._troubles.includes(SystemTroubles.PhoneLine)) {
            this._troubles.push(SystemTroubles.PhoneLine);
          }
          break;
        case 5:
          if (!this._troubles.includes(SystemTroubles.DigitalCommunicator)) {
            this._troubles.push(SystemTroubles.DigitalCommunicator);
          }
          break;
        case 6:
          if (!this._troubles.includes(SystemTroubles.Fuse)) {
            this._troubles.push(SystemTroubles.Fuse);
          }
          break;
      }
    }
  }
}