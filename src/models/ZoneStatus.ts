export enum ZoneStates {
  Ready = 0,
  NotReady = 1,
  Trouble = 2 
}

export class ZoneStatus {
  private readonly _currentState: ZoneStates;
  private readonly _latchedAlarmState: number;
  private readonly _armingState: number;
  private readonly _troubleAcknowledged: boolean;
  private readonly _bypassed: boolean;

  constructor(status: number) {
    this._currentState = status & 0b00000011;
    this._latchedAlarmState = status & 0b00001100;
    this._armingState = status & 0b00110000;
    this._troubleAcknowledged = (status & 0b01000000) === 0b01000000;
    this._bypassed = (status & 0b00100000) === 0b00100000;
  }

  get currentState(): ZoneStates {
    return this._currentState;
  }

  get ready(): boolean {
    return this._currentState === ZoneStates.Ready;
  }

  get trouble(): boolean {
    return this._currentState === ZoneStates.Trouble;
  }

  get latchedAlarmState(): number {
    return this._latchedAlarmState;
  }

  get armingState(): number {
    return this._armingState;
  }

  get troubleAcknowledged(): boolean {
    return this._troubleAcknowledged;
  }

  get bypassed(): boolean {
    return this._bypassed;
  }
}