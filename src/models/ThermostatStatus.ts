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

  constructor(currentTemperature: number, heatSetPoint: number, coolSetPoint: number, mode: number, currentState: number) {
    this._currentTemperature = this.convertToCelcius(currentTemperature);
    this._heatSetPoint = this.convertToCelcius(heatSetPoint);
    this._coolSetPoint = this.convertToCelcius(coolSetPoint);
    this._mode = mode;

    if ((currentState & 0b00000001) === 0b00000001) {
      this._state = ThermostatStates.Heating;
    } else if ((currentState & 0b00000010) === 0b00000010) {
      this._state = ThermostatStates.Cooling;
    }
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

  private convertToCelcius(temperature: number) {
    return -40.0 + (temperature / 2.0);
  }

}