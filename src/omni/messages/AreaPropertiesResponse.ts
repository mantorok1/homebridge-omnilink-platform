import { ObjectPropertiesResponse } from './ObjectPropertiesResponse';

export class AreaPropertiesResponse extends ObjectPropertiesResponse {
  private _mode: number;
  private _alarms: number;
  private _entryTimer: number;
  private _exitTimer: number;
  private _enabled: number;
  private _exitDelay: number;
  private _entryDelay: number;

  constructor(message: Buffer) {
    super(message, 13, 25);
    this._mode = message[6];
    this._alarms = message[7];
    this._entryTimer = message[8];
    this._exitTimer = message[9];
    this._enabled = message[10];
    this._exitDelay = message[11];
    this._entryDelay = message[12];
  }

  get mode(): number {
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

  get enabled(): number {
    return this._enabled;
  }

  get exitDelay(): number {
    return this._exitDelay;
  }

  get entryDelay(): number {
    return this._entryDelay;
  }
}