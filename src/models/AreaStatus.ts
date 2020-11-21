import { SecurityModes, Alarms } from '../omni/messages/enums';

export { SecurityModes, Alarms };

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

export class AreaStatus {
  private readonly _alarmsTriggered: Alarms[] = [];

  constructor(private mode: SecurityModes, alarms: number) {

    this._alarmsTriggered = [];
    for(const alarm in Alarms) {
      const alarmMode = Number(alarm);
      if (isNaN(alarmMode)) {
        continue;
      }
      
      if ((alarms & alarmMode) === alarmMode) {
        this._alarmsTriggered.push(alarmMode);
      }
    }
  }

  get securityMode(): SecurityModes {
    return this.mode;
  }

  get armedMode(): ArmedModes {
    switch (this.mode) {
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
    switch (this.mode) {
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