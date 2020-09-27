import { ApplicationDataResponse } from './ApplicationDataResponse';

export enum ZoneCurrentStates {
  Secure = 0,
  NotReady = 1,
  Trouble = 2 
}

export type ExtendedZoneStatus = {
  currentState: ZoneCurrentStates,
  latchedAlarmState: number,
  armingState: number,
  troubleAcknowledged: boolean
}

export class ExtendedZoneStatusResponse extends ApplicationDataResponse {

  private _zones!: Map<number, ExtendedZoneStatus>;

  get zones(): Map<number, ExtendedZoneStatus> {
    return this._zones;
  }

  deserialize(message: Buffer): void {
    super.deserialize(message);

    this._zones = new Map<number, ExtendedZoneStatus>();
    const zoneCount = (message[1] - 3) / 4;

    for(let i = 1; i <= zoneCount; i++) {
      const startPos = (i - 1) * 4 + 5;
      const zoneId = message[startPos] * 256 + message[startPos + 1];
      const status: ExtendedZoneStatus = {
        currentState: message[startPos + 2] & 0b00000011,
        latchedAlarmState: message[startPos + 2] & 0b00001100,
        armingState: message[startPos + 2] & 0b00110000,
        troubleAcknowledged: (message[startPos + 2] & 0b01000000) === 0b01000000,
      };
      this._zones.set(zoneId, status);
    }
  }
}