import { util } from './util';

export enum ThermostatModes {
  Off = 0,
  Heat = 1,
  Cool = 2,
  Auto = 3,
  EmergencyHeat = 4
}

export enum ThermostatStates {
  Idle = 0,
  Heating = 1,
  Cooling = 2
}

export class ThermostatStatus {
  private readonly _currentTemperature: number;
  private readonly _heatSetPoint: number;
  private readonly _coolSetPoint: number;
  private readonly _mode: ThermostatModes;
  private readonly _state: ThermostatStates = ThermostatStates.Idle;
  private readonly _currentHumidity: number;
  private readonly _humidifySetPoint: number;
  private readonly _dehumidifySetPoint: number;

  constructor(currentTemperature: number, heatSetPoint: number, coolSetPoint: number, mode: number, currentState: number,
    currentHumidity: number, humidifySetPoint: number, dehumidifySetPoint: number) {

    this._currentTemperature = util.convertToCelcius(currentTemperature);
    this._heatSetPoint = util.convertToCelcius(heatSetPoint);
    this._coolSetPoint = util.convertToCelcius(coolSetPoint);
    this._mode = mode;

    if ((currentState & 0b00000001) === 0b00000001) {
      this._state = ThermostatStates.Heating;
    } else if ((currentState & 0b00000010) === 0b00000010) {
      this._state = ThermostatStates.Cooling;
    }

    this._currentHumidity = util.convertToHumidity(currentHumidity);
    this._humidifySetPoint = util.convertToHumidity(humidifySetPoint);
    this._dehumidifySetPoint = util.convertToHumidity(dehumidifySetPoint);
  }

  get currentTemperature(): number {
    return this._currentTemperature;
  }

  get heatSetPoint(): number {
    return this._heatSetPoint;
  }

  get coolSetPoint(): number {
    return this._coolSetPoint;
  }

  get mode(): ThermostatModes {
    return this._mode;
  }

  get state(): ThermostatStates {
    return this._state;
  }

  get currentHumidity(): number {
    return this._currentHumidity;
  }

  get humidifySetPoint(): number {
    return this._humidifySetPoint;
  }

  get dehumidifySetPoint(): number {
    return this._dehumidifySetPoint;
  }
}