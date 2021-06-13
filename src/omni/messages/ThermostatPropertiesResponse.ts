import { ObjectPropertiesResponse } from './ObjectPropertiesResponse';

export class ThermostatPropertiesResponse extends ObjectPropertiesResponse {

  private readonly _communicating: number;
  private readonly _temperature: number;
  private readonly _heatSetPoint: number;
  private readonly _coolSetPoint: number;
  private readonly _mode: number;
  private readonly _fan: number;
  private readonly _hold: number;
  private readonly _type: number;
  private readonly _humidity: number;
  private readonly _humidifySetPoint: number;
  private readonly _dehumidifySetPoint: number;
  private readonly _outdoorTemperature: number;
  private readonly _state: number;

  constructor(message: Buffer) {
    super(message, 14, 26);

    this._communicating = message[6];
    this._temperature = message[7];
    this._heatSetPoint = message[8];
    this._coolSetPoint = message[9];
    this._mode = message[10];
    this._fan = message[11];
    this._hold = message[12];
    this._type = message[13];
    this._humidity = message[27];
    this._humidifySetPoint = message[28];
    this._dehumidifySetPoint = message[29];
    this._outdoorTemperature = message[30];
    this._state = message[31];
  }

  get communicating(): number {
    return this._communicating;
  }

  get temperature(): number {
    return this._temperature;
  }

  get heatSetPoint(): number {
    return this._heatSetPoint;
  }

  get coolSetPoint(): number {
    return this._coolSetPoint;
  }

  get mode(): number {
    return this._mode;
  }

  get fan(): number {
    return this._fan;
  }

  get hold(): number {
    return this._hold;
  }

  get type(): number {
    return this._type;
  }

  get humidity(): number {
    return this._humidity;
  }

  get humidifySetPoint(): number {
    return this._humidifySetPoint;
  }

  get dehumidifySetPoint(): number {
    return this._dehumidifySetPoint;
  }

  get outdoorTemperature(): number {
    return this._outdoorTemperature;
  }

  get state(): number {
    return this._state;
  }
}