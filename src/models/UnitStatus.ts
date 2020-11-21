export enum UnitStates {
  Off = 0,
  On = 1
}

export class UnitStatus {
  private readonly _state: UnitStates;
  private readonly _brightness: number;

  constructor(status: UnitStates, brightness?: number) {
    this._state = status;
    if (brightness !== undefined) {
      this._brightness = brightness;
    } else {
      this._brightness = this.state === UnitStates.Off ? 0 : 100;
    }
  }

  get state(): UnitStates {
    return this._state;
  }

  get brightness(): number {
    return this._brightness;
  }
}