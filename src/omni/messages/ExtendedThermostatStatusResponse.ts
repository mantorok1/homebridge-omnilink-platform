import { ApplicationDataResponse } from './ApplicationDataResponse';

export class ExtendedThermostatStatusResponse extends ApplicationDataResponse {

  private readonly _id: number[] = [];
  private readonly _communicating: number[] = [];
  private readonly _temperature: number[] = [];
  private readonly _heatSetPoint: number[] = [];
  private readonly _coolSetPoint: number[] = [];
  private readonly _mode: number[] = [];
  private readonly _fan: number[] = [];
  private readonly _hold: number[] = [];
  private readonly _humidity: number[] = [];
  private readonly _humidifySetPoint: number[] = [];
  private readonly _dehumidifySetPoint: number[] = [];
  private readonly _outdoorTemperature: number[] = [];
  private readonly _state: number[] = [];

  constructor(message: Buffer) {
    super(message);

    const recordLength = message[4];
    const thermostatCount = (message[1] - 3) / recordLength;
    let offset = 5;
    for(let i = 1; i <= thermostatCount; i++) {
      this._id.push(message.readUInt16BE(offset));
      this._communicating.push(message[offset + 2]);
      this._temperature.push(message[offset + 3]);
      this._heatSetPoint.push(message[offset + 4]);
      this._coolSetPoint.push(message[offset + 5]);
      this._mode.push(message[offset + 6]);
      this._fan.push(message[offset + 7]);
      this._hold.push(message[offset + 8]);
      this._humidity.push(message[offset + 9]);
      this._humidifySetPoint.push(message[offset + 10]);
      this._dehumidifySetPoint.push(message[offset + 11]);
      this._outdoorTemperature.push(message[offset + 12]);
      this._state.push(message[offset + 13]);
      offset += recordLength;
    }
  }

  get id(): number[] {
    return this._id;
  }

  get communicating(): number[] {
    return this._communicating;
  }

  get temperature(): number[] {
    return this._temperature;
  }

  get heatSetPoint(): number[] {
    return this._heatSetPoint;
  }

  get coolSetPoint(): number[] {
    return this._coolSetPoint;
  }

  get mode(): number[] {
    return this._mode;
  }

  get fan(): number[] {
    return this._fan;
  }

  get hold(): number[] {
    return this._hold;
  }

  get humidity(): number[] {
    return this._humidity;
  }

  get humidifySetPoint(): number[] {
    return this._humidifySetPoint;
  }

  get dehumidifySetPoint(): number[] {
    return this._dehumidifySetPoint;
  }

  get outdoorTemperature(): number[] {
    return this._outdoorTemperature;
  }

  get state(): number[] {
    return this._state;
  }
}