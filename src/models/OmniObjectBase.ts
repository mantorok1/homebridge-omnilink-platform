export enum OmniObjectTypes {
  Area,
  Zone,
  Button,
  Code,
  Unit,
  Thermostat,
  AuxiliarySensor,
  AudioSource,
  AudioZone,
  AccessControl
}

export enum OmniObjectStatusTypes {
  Area,
  Zone,
  Button,
  Unit,
  Thermostat,
  AuxiliarySensor,
  AudioZone,
  AccessControlLock,
  AccessControlReader
}

export interface OmniObjectBaseArgs {
  id: number,
  name: string
}

export abstract class OmniObjectBase {
  private readonly _objectType: OmniObjectTypes;
  private readonly _id: number;
  private readonly _name: string;

  constructor(objectType: OmniObjectTypes, args: OmniObjectBaseArgs) {
    this._objectType = objectType;
    this._id = args.id;
    this._name = (args.name === undefined || args.name.trim().length === 0)
      ? `${OmniObjectTypes[this._objectType]} ${this._id}`
      : args.name.trim();

  }

  get objectType(): OmniObjectTypes {
    return this._objectType;
  }

  get id(): number {
    return this._id;
  }

  get name(): string {
    return this._name;
  }

  toString(): string {
    return `${OmniObjectTypes[this.objectType]} ${this.id} [${this.name}]`;
  }
}

export abstract class OmniObjectStatusBase {
  constructor(private statusType: OmniObjectStatusTypes) {
  }

  get type(): OmniObjectStatusTypes {
    return this.statusType;
  }
}