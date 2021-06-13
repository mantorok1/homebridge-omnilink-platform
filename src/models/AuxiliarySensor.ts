import { OmniObjectBase, OmniObjectBaseArgs, OmniObjectTypes } from './OmniObjectBase';
import { OmniTemperature } from './OmniTemperature';
import { TemperatureFormats } from './SystemFormats';

export enum AuxiliarySensorTypes {
  ProgrammableEnergySaverModule = 80,
  OutdoorTemperature = 81,
  Temperature = 82,
  TemperatureAlarm = 83,
  Humidity = 84,
  ExtendedRangeOutdoorTemperature = 85,
  ExtendedRangeTemperature = 86,
  ExtendedRangeTemperatureAlarm = 87
}

interface AuxiliarySensorStatusArgs {
  state: number,
  temperature: number,
  lowSetPoint: number,
  highSetPoint: number
}

interface AuxiliarySensorArgs extends OmniObjectBaseArgs, AuxiliarySensorStatusArgs {
  type: number,
}

export class AuxiliarySensor extends OmniObjectBase {
  private readonly _type: AuxiliarySensorTypes;
  private _status: AuxiliarySensorStatus;

  constructor(args: AuxiliarySensorArgs, temperatureFormat?: TemperatureFormats) {
    super(OmniObjectTypes.AuxiliarySensor, args);

    this._type = args.type;
    this._status = new AuxiliarySensorStatus(args, temperatureFormat);
  }

  get type(): AuxiliarySensorTypes {
    return this._type;
  }

  get isTemperatureSensor(): boolean {
    return this.type !== AuxiliarySensorTypes.Humidity;
  }

  get status(): AuxiliarySensorStatus {
    return this._status;
  }

  set status(value: AuxiliarySensorStatus) {
    this._status = value;
  }
}

export class AuxiliarySensorStatus {
  private readonly _state: number;
  private readonly _temperature: OmniTemperature;
  private readonly _lowSetPoint: OmniTemperature;
  private readonly _highSetPoint: OmniTemperature;

  constructor(args: AuxiliarySensorStatusArgs, temperatureFormat?: TemperatureFormats) {
    this._state = args.state;
    this._temperature = new OmniTemperature(args.temperature, temperatureFormat);
    this._lowSetPoint = new OmniTemperature(args.lowSetPoint, temperatureFormat);
    this._highSetPoint = new OmniTemperature(args.highSetPoint, temperatureFormat);
  }

  equals(status: AuxiliarySensorStatus | undefined): boolean {
    return status === undefined
      ? false
      : (this.state === status.state &&
        this.temperature.equals(status.temperature) &&
        this.lowSetPoint.equals(status.lowSetPoint) && 
        this.highSetPoint.equals(status.highSetPoint));
  }

  toString(): string {
    return this.temperature.toString();
  }

  get state(): number {
    return this._state;
  }

  get temperature(): OmniTemperature {
    return this._temperature;
  }

  get lowSetPoint(): OmniTemperature {
    return this._lowSetPoint;
  }

  get highSetPoint(): OmniTemperature {
    return this._highSetPoint;
  }
}