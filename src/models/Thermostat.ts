import { OmniObjectBase, OmniObjectBaseArgs, OmniObjectTypes } from './OmniObjectBase';
import { OmniTemperature } from './OmniTemperature';
import { TemperatureFormats } from './SystemFormats';

export enum ThermostatTypes {
  NotUsed = 0,
  AutoHeatCool = 1,
  HeatCool = 2,
  Heat = 3,
  Cool = 4,
  SetPoint = 5
}

export enum ThermostatModes {
  Off = 0,
  Heat = 1,
  Cool = 2,
  Auto = 3,
  EmergencyHeat = 4
}

export enum FanModes {
  Auto = 0,
  On = 1,
  Cycle = 2
}

export enum HoldStates {
  Off = 0,
  Hold = 1,
  VacationHold = 2,
  OtherHold = 3
}

export enum ThermostatStates {
  Idle = 0,
  Heating = 1,
  Cooling = 2,
  Humidifying = 3,
  Dehumidifying = 4
}

interface ThermostatStatusArgs {
  communicating: number,
  temperature: number,
  heatSetPoint: number,
  coolSetPoint: number,
  mode: number,
  fan: number,
  hold: number,
  humidity: number,
  humidifySetPoint: number,
  dehumidifySetPoint: number,
  outdoorTemperature: number,
  state: number
}

interface ThermostatArgs extends OmniObjectBaseArgs, ThermostatStatusArgs {
  type: number,
}

export class Thermostat extends OmniObjectBase {

  private readonly _type: ThermostatTypes;
  private _status: ThermostatStatus;

  constructor(args: ThermostatArgs, temperatureFormat?: TemperatureFormats) {
    super(OmniObjectTypes.Thermostat, args);

    this._type = args.type;
    this._status = new ThermostatStatus(args, temperatureFormat);
  }

  get type(): ThermostatTypes {
    return this._type;
  }

  get status(): ThermostatStatus {
    return this._status;
  }

  set status(value: ThermostatStatus) {
    this._status = value;
  }
}

export class ThermostatStatus {

  private readonly _communicating: number;
  private readonly _temperature: OmniTemperature;
  private readonly _heatSetPoint: OmniTemperature;
  private readonly _coolSetPoint: OmniTemperature;
  private readonly _mode: ThermostatModes;
  private readonly _fan: FanModes;
  private readonly _hold: HoldStates;
  private readonly _humidity: OmniTemperature;
  private readonly _humidifySetPoint: OmniTemperature;
  private readonly _dehumidifySetPoint: OmniTemperature;
  private readonly _outdoorTemperature: OmniTemperature;
  private readonly _state: number;

  constructor(args: ThermostatStatusArgs, temperatureFormat?: TemperatureFormats) {
    this._communicating = args.communicating;
    this._temperature = new OmniTemperature(args.temperature, temperatureFormat);
    this._heatSetPoint = new OmniTemperature(args.heatSetPoint, temperatureFormat);
    this._coolSetPoint = new OmniTemperature(args.coolSetPoint, temperatureFormat);
    this._mode = args.mode;
    this._fan = args.fan;
    this._hold = args.hold;
    this._humidity = new OmniTemperature(args.humidity, TemperatureFormats.Percentage);
    this._humidifySetPoint = new OmniTemperature(args.humidifySetPoint, TemperatureFormats.Percentage);
    this._dehumidifySetPoint = new OmniTemperature(args.dehumidifySetPoint, TemperatureFormats.Percentage);
    this._outdoorTemperature = new OmniTemperature(args.outdoorTemperature, temperatureFormat);
    this._state = args.state;
  }

  equals(status: ThermostatStatus | undefined): boolean {
    return status === undefined
      ? false
      : (this.communicating === status.communicating &&
        this.temperature.equals(status.temperature) &&
        this.heatSetPoint.equals(status.heatSetPoint) &&
        this.coolSetPoint.equals(status.coolSetPoint) &&
        this.mode === status.mode &&
        this.fan === status.fan &&
        this.hold === status.hold &&
        this.humidity.equals(status.humidity) &&
        this.humidifySetPoint.equals(status.humidifySetPoint) &&
        this.dehumidifySetPoint.equals(status.dehumidifySetPoint) &&
        this.outdoorTemperature.equals(status.outdoorTemperature) &&
        this.state === status.state);
  }

  toString(): string {
    let setPoint = '';
    switch (this.mode) {
      case ThermostatModes.Off:
        setPoint = 'None';
        break;
      case ThermostatModes.Auto:
        setPoint = `${this.heatSetPoint.toString()} - ${this.coolSetPoint.toString()}`;
        break;
      case ThermostatModes.Cool:
        setPoint = this.coolSetPoint.toString();
        break;
      default:
        setPoint = this.heatSetPoint.toString();
        break;
    }
    return `Temp: ${this.temperature.toString()}; Mode: ${ThermostatModes[this.mode]}; ` +
      `Set Point: ${setPoint}; Hold State: ${HoldStates[this.mode]}`;
  }

  get communicating(): number {
    return this._communicating;
  }

  get temperature(): OmniTemperature {
    return this._temperature;
  }

  get heatSetPoint(): OmniTemperature {
    return this._heatSetPoint;
  }

  get coolSetPoint(): OmniTemperature {
    return this._coolSetPoint;
  }

  get mode(): ThermostatModes {
    return this._mode;
  }

  get fan(): FanModes {
    return this._fan;
  }

  get hold(): HoldStates {
    switch (this._hold) {
      case 0:
        return HoldStates.Off;
      case 1:
        return HoldStates.Hold;
      case 2:
        return HoldStates.VacationHold;
      default:
        return HoldStates.OtherHold;
    }
  }

  get humidity(): OmniTemperature {
    return this._humidity;
  }

  get humidifySetPoint(): OmniTemperature {
    return this._humidifySetPoint;
  }

  get dehumidifySetPoint(): OmniTemperature {
    return this._dehumidifySetPoint;
  }

  get outdoorTemperature(): OmniTemperature {
    return this._outdoorTemperature;
  }

  get state(): number {
    return this._state;
  }

  isHeating(): boolean {
    return (this._state & 0b00000001) === 0b00000001;
  }

  isCooling(): boolean {
    return (this._state & 0b00000010) === 0b00000010;
  }

}