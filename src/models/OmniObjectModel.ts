import { OmniObjectBase, OmniObjectTypes, OmniObjectStatusTypes } from './OmniObjectBase';
import { Area } from './Area';
import { Zone } from './Zone';
import { Button } from './Button';
import { Code } from './Code';
import { Unit } from './Unit';
import { AuxiliarySensor } from './AuxiliarySensor';
import { SystemInformation } from './SystemInformation';
import { SystemFormats } from './SystemFormats';
import { SystemStatus } from './SystemStatus';
import { AccessControl } from './AccessControl';
import { Thermostat } from './Thermostat';
import { AudioSource } from './AudioSource';
import { AudioZone } from './AudioZone';

export { OmniObjectTypes, OmniObjectStatusTypes };

export enum SystemTroubles {
  Freeze = 1,
  BatteryLow = 2,
  ACPower = 3,
  PhoneLine = 4,
  DigitalCommunicator = 5,
  Fuse = 6
}

export class OmniObjectModel {
  private readonly _objects: Map<OmniObjectTypes, OmniObjects<OmniObjectBase>> = new Map<OmniObjectTypes, OmniObjects<OmniObjectBase>>();
  private _information?: SystemInformation;
  private _formats?: SystemFormats;
  private _troubles: SystemTroubles[] = [];
  private _status?: SystemStatus;

  constructor() {
    this._objects[OmniObjectTypes.Area] = new OmniObjects<Area>();
    this._objects[OmniObjectTypes.Zone] = new OmniObjects<Zone>();
    this._objects[OmniObjectTypes.Button] = new OmniObjects<Button>();
    this._objects[OmniObjectTypes.Code] = new OmniObjects<Code>();
    this._objects[OmniObjectTypes.Unit] = new OmniObjects<Unit>();
    this._objects[OmniObjectTypes.Thermostat] = new OmniObjects<Thermostat>();
    this._objects[OmniObjectTypes.AuxiliarySensor] = new OmniObjects<AuxiliarySensor>();
    this._objects[OmniObjectTypes.AudioSource] = new OmniObjects<AudioSource>();
    this._objects[OmniObjectTypes.AudioZone] = new OmniObjects<AudioZone>();
    this._objects[OmniObjectTypes.AccessControl] = new OmniObjects<AccessControl>();
  }

  get information(): SystemInformation {
    return this._information!;
  }

  set information(value: SystemInformation) {
    this._information = value;
  }

  get formats(): SystemFormats {
    return this._formats!;
  }

  set formats(value: SystemFormats) {
    this._formats = value;
  }

  get status(): SystemStatus {
    return this._status!;
  }

  set status(value: SystemStatus) {
    this._status = value;
  }

  get areas(): OmniObjects<Area> {
    return this._objects[OmniObjectTypes.Area] as OmniObjects<Area>;
  }

  get troubles(): SystemTroubles[] {
    return this._troubles;
  }

  get zones(): OmniObjects<Zone> {
    return this._objects[OmniObjectTypes.Zone] as OmniObjects<Zone>;
  }

  get buttons(): OmniObjects<Button> {
    return this._objects[OmniObjectTypes.Button] as OmniObjects<Button>;
  }

  get codes(): OmniObjects<Code> {
    return this._objects[OmniObjectTypes.Code] as OmniObjects<Code>;
  }

  get units(): OmniObjects<Unit> {
    return this._objects[OmniObjectTypes.Unit] as OmniObjects<Unit>;
  }

  get thermostats(): OmniObjects<Thermostat> {
    return this._objects[OmniObjectTypes.Thermostat] as OmniObjects<Thermostat>;
  }

  get sensors(): OmniObjects<AuxiliarySensor> {
    return this._objects[OmniObjectTypes.AuxiliarySensor] as OmniObjects<AuxiliarySensor>;
  }

  get audioSources(): OmniObjects<AudioSource> {
    return this._objects[OmniObjectTypes.AudioSource] as OmniObjects<AudioSource>;
  }

  get audioZones(): OmniObjects<AudioZone> {
    return this._objects[OmniObjectTypes.AudioZone] as OmniObjects<AudioZone>;
  }

  get accessControls(): OmniObjects<AccessControl> {
    return this._objects[OmniObjectTypes.AccessControl] as OmniObjects<AccessControl>;
  }
}

export class OmniObjects<TOmniObject extends OmniObjectBase> {
  [key: number]: TOmniObject;

  get length(): number {
    return Object.keys(this).length;
  }

  keys(): number[] {
    return Object.keys(this).map(k => Number(k));
  }

  hasKey(key: number): boolean {
    return this[key] !== undefined;
  }

  values(): TOmniObject[] {
    return Object.values(this);
  }

  entries(): [number, TOmniObject][] {
    return Object.entries(this).map<[number, TOmniObject]>(v => [Number(v[0]), v[1]]);
  }
}