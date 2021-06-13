import { OmniObjectBase, OmniObjectBaseArgs, OmniObjectTypes } from './OmniObjectBase';

export enum ZoneTypes {
  EntryExit = 0,
  Perimeter = 1,
  NightInterior = 2,
  AwayInterior = 3,
  DoubleEntryDelay = 4,
  QuadrupleEntryDelay = 5,
  LatchingPerimeter = 6,
  LatchingNightInterior = 7,
  LatchingAwayInterior = 8,
  Panic = 16,
  PoliceEmergency = 17,
  Duress = 18,
  Tamper = 19,
  LatchingTamper = 20,
  Fire = 32,
  FireEmergency = 33,
  GasAlarm = 34,
  AuxiliaryEmergency = 48,
  Trouble = 49,
  Freeze = 54,
  Water = 55,
  FireTamper = 56,
  Auxiliary = 64,
  KeyswitchInput = 65,
  ProgrammableEnergySaverModule = 80,
  OutdoorTemperature = 81,
  Temperature = 82,
  TemperatureAlarm = 83,
  Humidity = 84,
  ExtendedRangeOutdoorTemperature = 85,
  ExtendedRangeTemperature = 86,
  ExtendedRangeTemperatureAlarm = 87
}

export enum ZoneStates {
  Ready = 0,
  NotReady = 1,
  Trouble = 2 
}

interface ZoneStatusArgs {
  state: number,
  loopReading: number
}

interface ZoneArgs extends OmniObjectBaseArgs, ZoneStatusArgs {
  type: number,
  areaId: number,
  options: number
}

export class Zone extends OmniObjectBase {
  private readonly _type: ZoneTypes;
  private readonly _areaId: number;
  private readonly _options: number;
  private _status: ZoneStatus;

  constructor(args: ZoneArgs) {
    super(OmniObjectTypes.Zone, args);
    this._type = args.type;
    this._areaId = args.areaId;
    this._options = args.options;
    this._status = new ZoneStatus(args);
  }

  get type(): ZoneTypes {
    return this._type;
  }

  get areaId(): number {
    return this._areaId;
  }

  get options(): number {
    return this._options;
  }

  get status(): ZoneStatus {
    return this._status;
  }

  set status(value: ZoneStatus) {
    this._status = value;
  }

  get isAuxiliarySensor(): boolean {
    return this._type >= ZoneTypes.ProgrammableEnergySaverModule;
  }
}

export class ZoneStatus {
  private readonly _state: number;
  private readonly _loopReading: number;

  private readonly _currentState: ZoneStates;
  private readonly _latchedAlarmState: number;
  private readonly _armingState: number;
  private readonly _troubleAcknowledged: boolean;
  private readonly _bypassed: boolean;

  constructor(args: ZoneStatusArgs) {
    this._state = args.state;
    this._loopReading = args.loopReading;

    this._currentState = args.state & 0b00000011;
    this._latchedAlarmState = args.state & 0b00001100;
    this._armingState = args.state & 0b00110000;
    this._troubleAcknowledged = (args.state & 0b01000000) === 0b01000000;
    this._bypassed = (args.state & 0b00100000) === 0b00100000;
  }

  equals(status: ZoneStatus | undefined): boolean {
    return status === undefined
      ? false
      : (this.state === status.state); // && this.loopReading === status.loopReading);
  }

  toString(): string {
    return `${ZoneStates[this.currentState]}${this.bypassed ? ', Bypassed' : ''}`;
  }

  get state(): number {
    return this._state;
  }

  get loopReading(): number {
    return this._loopReading;
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