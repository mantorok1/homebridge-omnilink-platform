import { OmniObjectBase, OmniObjectBaseArgs, OmniObjectTypes } from './OmniObjectBase';

export enum AudioZoneStates {
  Off = 0,
  On = 1
}

export enum AudioZoneMute {
  Off = 0,
  On = 1
}

interface AudioZoneStatusArgs {
  state: number,
  sourceId: number,
  volume: number,
  mute: number
}

interface AudioZoneArgs extends OmniObjectBaseArgs, AudioZoneStatusArgs {
}

export class AudioZone extends OmniObjectBase {
  private _status: AudioZoneStatus;

  constructor(args: AudioZoneArgs) {
    super(OmniObjectTypes.AudioZone, args);
    this._status = new AudioZoneStatus(args);
  }

  get status(): AudioZoneStatus {
    return this._status;
  }

  set status(value: AudioZoneStatus) {
    this._status = value;
  }
}

export class AudioZoneStatus {
  private readonly _power: boolean;
  private readonly _sourceId: number;
  private readonly _volume: number;
  private readonly _mute: boolean;

  constructor(args: AudioZoneStatusArgs) {
    this._power = args.state === AudioZoneStates.On;
    this._sourceId = args.sourceId;
    this._volume = args.volume;
    this._mute = args.mute === AudioZoneMute.On;
  }

  equals(status: AudioZoneStatus | undefined): boolean {
    return status === undefined
      ? false
      : (this.power === status.power && this.sourceId === status.sourceId && this.volume === status.volume && this.mute === status.mute);
  }

  toString(): string {
    return `Power: ${this.power ? 'On' : 'Off'}, Source Id: ${this.sourceId}, Volume: ${this.power}, Mute: ${this.mute ? 'On' : 'Off'}`;
  }

  get power(): boolean {
    return this._power;
  }

  get sourceId(): number {
    return this._sourceId;
  }

  get volume(): number {
    return this._volume;
  }

  get mute(): boolean {
    return this._mute;
  }
}