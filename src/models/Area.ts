import { OmniObjectBase, OmniObjectBaseArgs, OmniObjectTypes, OmniObjectStatusBase, OmniObjectStatusTypes } from './OmniObjectBase';

export enum SecurityModes {
  Off = 0,
  Day = 1,
  Night = 2,
  Away = 3,
  Vacation = 4,
  DayInstant = 5,
  NightDelayed = 6,
  ArmingDay = 9,
  ArmingNight = 10,
  ArmingAway = 11,
  ArmingVacation = 12,
  ArmingDayInstant = 13,
  ArmingNightDelayed = 14,
}

export enum ArmedModes {
  Disarmed = 0,
  ArmedDay = 1,
  ArmedNight = 2,
  ArmedAway = 3
}

export enum ExtendedArmedModes {
  Disarmed = 0,
  ArmedDay = 1,
  ArmedNight = 2,
  ArmedAway = 3,
  ArmedVacation = 4,
  ArmedDayInstant = 5,
  ArmedNightDelayed = 6
}

export enum Alarms {
  Burglary = 1,
  Fire = 2,
  Gas = 4,
  Auxiliary = 8,
  Freeze = 16,
  Water = 32,
  Duress = 64,
  Temperature = 128
}

interface AreaStatusArgs {
  mode: number,
  alarms: number,
  entryTimer: number,
  exitTimer: number
}

interface AreaArgs extends OmniObjectBaseArgs, AreaStatusArgs {
  enabled: number,
  exitDelay: number,
  entryDelay: number
}

export class Area extends OmniObjectBase {
  private readonly _enabled: boolean;
  private readonly _exitDelay: number;
  private readonly _entryDelay: number;
  private _status: AreaStatus;

  constructor(args: AreaArgs) {
    super(OmniObjectTypes.Area, args);
    this._enabled = args.enabled === 1;
    this._exitDelay = args.exitDelay;
    this._entryDelay = args.entryDelay;
    this._status = new AreaStatus({
      mode: args.mode,
      alarms: args.alarms,
      entryTimer: args.entryTimer,
      exitTimer: args.exitTimer,
    });
  }

  get enabled(): boolean {
    return this._enabled;
  }

  get exitDelay(): number {
    return this._exitDelay;
  }

  get entryDelay(): number {
    return this._entryDelay;
  }

  get status(): AreaStatus {
    return this._status;
  }

  set status(value: AreaStatus) {
    this._status = value;
  }
}

export class AreaStatus extends OmniObjectStatusBase {
  private readonly _mode: SecurityModes;
  private readonly _alarms: number;
  private readonly _entryTimer: number;
  private readonly _exitTimer: number;
  private readonly _alarmsTriggered: Alarms[];

  constructor(args: AreaStatusArgs) {
    super(OmniObjectStatusTypes.Area);

    this._mode = args.mode;
    this._alarms = args.alarms;
    this._entryTimer = args.entryTimer;
    this._exitTimer = args.exitTimer;

    this._alarmsTriggered = [];
    for(const alarm in Alarms) {
      const alarmMode = Number(alarm);
      if (isNaN(alarmMode)) {
        continue;
      }
      
      if ((args.alarms & alarmMode) === alarmMode) {
        this._alarmsTriggered.push(alarmMode);
      }
    }
  }

  equals(status: AreaStatus | undefined): boolean {
    return status === undefined
      ? false
      : (this.mode === status.mode &&
          this.alarms === status.alarms &&
          this.entryTimer === status.entryTimer &&
          this.exitTimer === status.exitTimer);
  }

  toString(): string {
    let message = `${SecurityModes[this._mode]}`;
    if (this.alarmsTriggered.length > 0) {
      const alarms = this.alarmsTriggered.map((alarm) => Alarms[alarm]);
      message = `${message}; Alarm(s) triggered: ${alarms.join()}`;
    }
    return message;
  }

  get mode(): SecurityModes {
    return this._mode;
  }

  get alarms(): number {
    return this._alarms;
  }

  get entryTimer(): number {
    return this._entryTimer;
  }

  get exitTimer(): number {
    return this._exitTimer;
  }

  get armedMode(): ArmedModes {
    switch (this._mode) {
      case SecurityModes.Off:
        return ArmedModes.Disarmed;
      case SecurityModes.Day:
      case SecurityModes.DayInstant:
      case SecurityModes.ArmingDay:
      case SecurityModes.ArmingDayInstant:
        return ArmedModes.ArmedDay;
      case SecurityModes.Night:
      case SecurityModes.NightDelayed:
      case SecurityModes.ArmingNight:
      case SecurityModes.ArmingNightDelayed:
        return ArmedModes.ArmedNight;
      default:
        return ArmedModes.ArmedAway;
    }
  }

  get extendedArmedMode(): ExtendedArmedModes {
    switch (this._mode) {
      case SecurityModes.Off:
        return ExtendedArmedModes.Disarmed;
      case SecurityModes.Day:
      case SecurityModes.ArmingDay:
        return ExtendedArmedModes.ArmedDay;
      case SecurityModes.Night:
      case SecurityModes.ArmingNight:
        return ExtendedArmedModes.ArmedNight;
      case SecurityModes.DayInstant:
      case SecurityModes.ArmingDayInstant:
        return ExtendedArmedModes.ArmedDayInstant;
      case SecurityModes.NightDelayed:
      case SecurityModes.ArmingNightDelayed:
        return ExtendedArmedModes.ArmedNightDelayed;
      case SecurityModes.Vacation:
      case SecurityModes.ArmingVacation:
        return ExtendedArmedModes.ArmedVacation;
      default:
        return ExtendedArmedModes.ArmedAway;
    }
  }

  get alarmsTriggered(): Alarms[] {
    return this._alarmsTriggered;
  }
}