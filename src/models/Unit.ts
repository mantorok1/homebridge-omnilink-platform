import { OmniObjectBase, OmniObjectBaseArgs, OmniObjectTypes } from './OmniObjectBase';

export enum UnitTypes {
  Standard = 1,
  Extended = 2,
  Compose = 3,
  UPB = 4,
  HLCRoom = 5,
  HLCLoad = 6,
  LuminaMode = 7,
  RadioRA = 8,
  CentraLite = 9,
  ViziaRFRoom = 10,
  ViziaRFLoad = 11,
  Flag = 12,
  Output = 13,
  AudioZone = 14,
  AudioSource = 15
}

export enum UnitStates {
  Off = 0,
  On = 1
}

interface UnitStatusArgs {
  state: number,
  timeRemaining: number
}

interface UnitArgs extends OmniObjectBaseArgs, UnitStatusArgs {
  type: number,
}

export class Unit extends OmniObjectBase {
  private readonly _type: UnitTypes;
  private _status: UnitStatus;

  constructor(args: UnitArgs) {
    super(OmniObjectTypes.Unit, args);
    this._type = args.type;
    this._status = new UnitStatus(args);
  }

  get type(): UnitTypes {
    return this._type;
  }

  get status(): UnitStatus {
    return this._status;
  }

  set status(value: UnitStatus) {
    this._status = value;
  }
}

export class UnitStatus {
  private readonly _state: UnitStates;
  private readonly _brightness: number;
  private readonly _timeRemaining: number;

  constructor(args: UnitStatusArgs) {
    this._state = args.state;
    this._timeRemaining = args.timeRemaining;

    this._state = (args.state === 0 || args.state === 2)
      ? UnitStates.Off
      : UnitStates.On;
    this._brightness = (args.state >= 100 && args.state <= 200)
      ? args.state - 100
      : this._state === UnitStates.Off ? 0 : 100;
  }

  equals(status: UnitStatus | undefined): boolean {
    return status === undefined
      ? false
      : (this.state === status.state && this.brightness === status.brightness && this.timeRemaining === status.timeRemaining);
  }

  toString(): string {
    return `${UnitStates[this.state]}`;
  }

  get state(): UnitStates {
    return this._state;
  }

  get brightness(): number {
    return this._brightness;
  }

  get timeRemaining(): number {
    return this._timeRemaining;
  }
}