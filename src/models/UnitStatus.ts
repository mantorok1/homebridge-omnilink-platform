import { IStatus } from './IStatus';

export enum UnitStates {
  Off = 0,
  On = 1
}

export class UnitStatus implements IStatus {
  public readonly statusBuffer: Buffer;
  private readonly _state: UnitStates;
  private readonly _brightness: number;

  constructor(status: number) {
    this.statusBuffer = Buffer.from([status]);
    this._state = (status === 0 || status === 2)
      ? UnitStates.Off
      : UnitStates.On;
    this._brightness = (status >= 100 && status <= 200)
      ? status - 100
      : this._state === UnitStates.Off ? 0 : 100;
  }

  static getKey(unitId: number): string {
    return `unit-${unitId}`;
  }

  equals(status: UnitStatus | undefined): boolean {
    return status === undefined
      ? false
      : (this.statusBuffer.equals(status.statusBuffer));
  }

  getKey(id: number): string {
    return UnitStatus.getKey(id);
  }

  get state(): UnitStates {
    return this._state;
  }

  get brightness(): number {
    return this._brightness;
  }
}