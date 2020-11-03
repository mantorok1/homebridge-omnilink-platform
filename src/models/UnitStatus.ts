export enum UnitStates {
  Off = 0,
  On = 1
}

export class UnitStatus {
  private readonly _state: UnitStates;

  constructor(status: number) {
    this._state = status;
  }

  get state(): number {
    return this._state;
  }
}