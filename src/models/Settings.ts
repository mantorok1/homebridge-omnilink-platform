import { PlatformConfig } from 'homebridge';

type GarageDoor = {
  zoneId: number,
  openTime: number
}

type Pushover = {
  token: string,
  users: string[],
  alarms: {
    burglary: boolean,
    fire: boolean,
    gas: boolean,
    auxiliary: boolean,
    freeze: boolean,
    water: boolean,
    duress: boolean,
    temperature: boolean
  },
  troubles: {
    freeze: boolean,
    batterylow: boolean,
    acpower: boolean,
    phoneline: boolean,
    digitalcommunicator: boolean,
    fuse: boolean
  }
}

export type MqttSettings = {
  host: string | undefined,
  port: number | undefined,
  username: string | undefined,
  password: string | undefined,
  topicPrefix: string | undefined,
  showMqttEvents: boolean, 
}

type Exclude = {
  areas: number[],
  zones: number[],
  units: number[],
  buttons: number[],
  thermostats: number[],
  auxiliarySensors: number[],
  accessControls: number[]
}

export class Settings {
  private readonly _privateKey: Buffer;
  private readonly _sensors: Map<number, string>;
  private readonly _garageDoors: Map<number, GarageDoor>;
  private readonly _units: Map<number, string>;
  private readonly _exclude: Exclude;
  private readonly _mqtt?: MqttSettings;
  private readonly _defaultAccessoryMappings = {
    zone: 'motion',
    zoneFireEmergency: 'smoke',
    unit: 'switch',
  };

  constructor(private readonly config: PlatformConfig) {
    this._privateKey = this.getPrivateKey([<string>config.key1, <string>config.key2]);
    this._sensors = new Map<number, string>();
    this._garageDoors = new Map<number, GarageDoor>();
    this._units = new Map<number, string>();
    this._exclude = {
      areas: [],
      zones: [],
      units: [],
      buttons: [],
      thermostats: [],
      auxiliarySensors: [],
      accessControls: [],
    };

    if (config.map?.zones !== undefined) {
      for(const sensorType of Object.keys(config.map.zones)) {
        const zoneIds: number[] = config.map.zones[sensorType].split(',').map(Number);
        for(const zoneId of zoneIds) {
          this._sensors.set(zoneId, sensorType);
        }
      }
    }

    if (config.garageDoors !== undefined && Array.isArray(config.garageDoors)) {
      for(const garageDoor of config.garageDoors) {
        if (garageDoor.buttonId !== undefined && garageDoor.zoneId !== undefined && garageDoor.openTime !== undefined) {
          this._garageDoors.set(garageDoor.buttonId, { zoneId: garageDoor.zoneId, openTime: garageDoor.openTime });
        }
      }
    }

    if (config.map?.units !== undefined) {
      for (const accessoryType of Object.keys(config.map.units)) {
        const unitIds: number[] = config.map.units[accessoryType].split(',').map(Number);
        for(const unitId of unitIds) {
          this._units.set(unitId, accessoryType);
        }
      }
    }

    for (const objectType of Object.keys(this._exclude)) {
      if (config.exclude?.[objectType] !== undefined && config.exclude[objectType].length > 0) {
        this._exclude[objectType].push(...config.exclude[objectType].split(',').map(Number));
      }
    }

    if (config.mqtt) {
      const mqtt = <Record<string, string | number | boolean | undefined>>config.mqtt;

      this._mqtt = {
        host: <string>mqtt.host,
        port: <number | undefined>mqtt.port ?? 1883,
        username: <string | undefined>mqtt.username,
        password: <string | undefined>mqtt.password,
        topicPrefix: <string | undefined>mqtt.topicPrefix,
        showMqttEvents: <boolean | undefined>mqtt.showMqttEvents ?? false,
      };
    }
  }

  // Getters
  get name(): string {
    return this.config.name ?? 'Omni';
  }

  get address(): string {
    return <string>this.config.address ?? '';
  }

  get port(): number {
    return <number>this.config.port ?? 4369;
  }

  get privateKey(): Buffer {
    return this._privateKey;
  }

  get includeAreas(): boolean {
    return <boolean>this.config.includeAreas ?? true;
  }

  get includeZones(): boolean {
    return <boolean>this.config.includeZones ?? true;
  }

  get includeBypassZones(): boolean {
    return <boolean>this.config.includeBypassZones ?? false;
  }

  get includeButtons(): boolean {
    return <boolean>this.config.includeButtons ?? true;
  }

  get includeUnits(): boolean {
    return <boolean>this.config.includeUnits ?? true;
  }

  get includeThermostats(): boolean {
    return <boolean>this.config.includeThermostats ?? true;
  }

  get includeEmergencyAlarms(): boolean {
    return <boolean>this.config.includeEmergencyAlarms ?? true;
  }

  get includeAccessControls(): boolean {
    return <boolean>this.config.includeAccessControls ?? true;
  }

  get includeAuxiliarySensors(): boolean {
    return <boolean>this.config.includeAuxiliarySensors ?? true;
  }

  get setHomeToAway(): boolean {
    return <boolean>this.config.setHomeToAway ?? false;
  }

  get setNightToAway(): boolean {
    return <boolean>this.config.setNightToAway ?? false;
  }

  get securityCode(): string {
    return <string>this.config.securityCode ?? '';
  }

  get defaultZoneAccessoryType(): string {
    return <string>this.config.defaultAccessoryMappings?.zone ?? this._defaultAccessoryMappings.zone;
  }

  get defaultZoneFireEmergencyAccessoryType(): string {
    return <string>this.config.defaultAccessoryMappings?.zoneFireEmergency ?? this._defaultAccessoryMappings.zoneFireEmergency;
  }

  get defaultUnitAccessoryType(): string {
    return <string>this.config.defaultAccessoryMappings?.unit ?? this._defaultAccessoryMappings.unit;
  }

  get sensors(): Map<number, string> {
    return this._sensors;
  }

  get garageDoors(): Map<number, GarageDoor> {
    return this._garageDoors;
  }

  get units(): Map<number, string> {
    return this._units;
  }

  get garageDoorZones(): number[] {
    return [...this._garageDoors.values()].map(g => g.zoneId);
  }

  get exclude(): Exclude {
    return this._exclude;
  }

  get minTemperature(): number {
    return <number>this.config.minTemperature ?? 0;
  }

  get maxTemperature(): number {
    return <number>this.config.maxTemperature ?? 40;
  }

  get includeHoldStatusSwitches(): boolean {
    return <boolean>this.config.includeHoldStatusSwitches ?? false;
  }

  get includeFanModeSwitches(): boolean {
    return <boolean>this.config.includeFanModeSwitches ?? false;
  }

  get includeHumidityControls(): boolean {
    return <boolean>this.config.includeHumidityControls ?? false;
  }

  get targetHumiditySetPointType(): number {
    return <number>this.config.targetHumiditySetPointType ?? 1;
  }

  get targetHumidityDifference(): number {
    return <number>this.config.targetHumidityDifference ?? 0;
  }

  get syncTime(): boolean {
    return <boolean>this.config.syncTime ?? false;
  }

  get showHomebridgeEvents(): boolean {
    return <boolean>this.config.showHomebridgeEvents ?? false;
  }

  get showOmniEvents(): boolean {
    return <boolean>this.config.showOmniEvents ?? false;
  }

  get excludeZoneStatusChanges(): boolean {
    return <boolean>this.config.excludeZoneStatusChanges ?? false;
  }

  get excludeTemperatureChanges(): boolean {
    return <boolean>this.config.excludeTemperatureChanges ?? false;
  }

  get showRequestResponse(): boolean {
    return <boolean>this.config.showRequestResponse ?? false;
  }

  get clearCache(): boolean {
    return <boolean>this.config.clearCache ?? false;
  }

  get forceAutoDiscovery(): boolean {
    return <boolean | undefined>this.config.forceAutoDiscovery ?? false;
  }

  get pushover(): Pushover | undefined {
    return <Pushover | undefined>this.config.pushover;
  }

  get mqtt(): MqttSettings | undefined {
    return <MqttSettings | undefined>this._mqtt;
  }

  get isValid(): boolean {
    if (this.address === '') {
      return false;
    }
    if ((this.config.key1 ?? '') === '') {
      return false;
    }
    if ((this.config.key2 ?? '') === '') {
      return false;
    }
    if (this._privateKey.length !== 16) {
      return false;
    }
    return true;
  }

  private getPrivateKey(keys: string[]): Buffer {
    const privateKey = Buffer.alloc(16);

    for(let i = 0; i < keys.length; i++) {
      if (keys[i] !== undefined) {
        const hex = keys[i].replace(/[^0-9A-Fa-f]/g, '');
        const key = Buffer.from(hex, 'hex');
        key.copy(privateKey, i * 8, 0, 8);
      }
    }

    return privateKey;
  }
}