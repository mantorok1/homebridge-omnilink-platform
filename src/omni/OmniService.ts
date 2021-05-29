import events = require('events');
import NodeCache = require('node-cache');

import { OmniLinkPlatform } from '../platform';
import { OmniSession } from './OmniSession';

import { MessageTypes, ObjectTypes, Commands, SecurityModes, Alarms, AuthorityLevels, SystemTroubles, EmergencyTypes, ZoneTypes }
  from './messages/enums';
import { ObjectTypeCapacitiesRequest } from './messages/ObjectTypeCapacitiesRequest';
import { ObjectTypeCapacitiesResponse } from './messages/ObjectTypeCapacitiesResponse';
import { ObjectPropertiesRequest } from './messages/ObjectPropertiesRequest';
import { ZonePropertiesResponse } from './messages/ZonePropertiesResponse';
import { UnitPropertiesResponse } from './messages/UnitPropertiesResponse';
import { AreaPropertiesResponse } from './messages/AreaPropertiesResponse';
import { ButtonPropertiesResponse } from './messages/ButtonPropertiesResponse';
import { ThermostatPropertiesResponse } from './messages/ThermostatPropertiesResponse';
import { CodePropertiesResponse } from './messages/CodePropertiesResponse';
import { AccessControlPropertiesResponse } from './messages/AccessControlPropertiesResponse';
import { AuxiliarySensorPropertiesResponse } from './messages/AuxiliarySensorPropertiesResponse';
import { SetTimeCommandRequest } from './messages/SetTimeCommandRequest';
import { ControllerCommandRequest } from './messages/ControllerCommandRequest';
import { EnableNotificationsRequest } from './messages/EnableNotificationsRequest';
import { SystemInformationRequest } from './messages/SystemInformationRequest';
import { SystemInformationResponse } from './messages/SystemInformationResponse';
import { SystemStatusRequest } from './messages/SystemStatusRequest';
import { SystemStatusResponse } from './messages/SystemStatusResponse';
import { SystemTroublesRequest } from './messages/SystemTroublesRequest';
import { SystemTroublesResponse } from './messages/SystemTroublesResponse';
import { SystemFormatsRequest } from './messages/SystemFormatsRequest';
import { SystemFormatsResponse, TemperatureFormats } from './messages/SystemFormatsResponse';
import { ExtendedObjectStatusRequest } from './messages/ExtendedObjectStatusRequest';
import { ExtendedAreaStatusResponse } from './messages/ExtendedAreaStatusResponse';
import { ExtendedZoneStatusResponse } from './messages/ExtendedZoneStatusResponse';
import { ExtendedUnitStatusResponse } from './messages/ExtendedUnitStatusResponse';
import { ExtendedThermostatStatusResponse } from './messages/ExtendedThermostatStatusResponse';
import { SecurityCodeValidationRequest } from './messages/SecurityCodeValidationRequest';
import { SecurityCodeValidationResponse } from './messages/SecurityCodeValidationResponse';
import { ExtendedAccessControlLockStatusResponse } from './messages/ExtendedAccessControlLockStatusResponse';
import { ExtendedAuxiliarySensorStatusResponse } from './messages/ExtendedAuxiliarySensorStatusResponse';
import { KeypadEmergencyRequest } from './messages/KeypadEmergencyRequest';
import { ApplicationDataResponse } from './messages/ApplicationDataResponse';
import { ObjectPropertiesResponse } from './messages/ObjectPropertiesResponse';

import { IStatus } from '../models/IStatus';
import { AreaStatus, ArmedModes, ExtendedArmedModes } from '../models/AreaStatus';
import { ZoneStatus, ZoneStates } from '../models/ZoneStatus';
import { UnitStatus, UnitStates } from '../models/UnitStatus';
import { ThermostatStatus, ThermostatModes } from '../models/ThermostatStatus';
import { AccessControlLockStatus } from '../models/AccessControlLockStatus';
import { AuxiliarySensorStatus } from '../models/AuxiliarySensorStatus';

export type Devices = {
  areas: number[],
  zones: number[],
  units: number[],
  buttons: number[],
  thermostats: number[],
  codes: number[],
  accessControls: number[]
}

export class OmniService extends events.EventEmitter {
  private readonly session: OmniSession;
  private pingIntervalId?: NodeJS.Timeout;
  private syncTimeIntervalId?: NodeJS.Timeout;
  private _model?: string;
  private _version?: string;
  private _temperatureFormat?: TemperatureFormats;
  private _omniObjects: Record<number, Map<number, ObjectPropertiesResponse>>;
  private _troubles: SystemTroubles[];
  private _statusCache: NodeCache;

  constructor(private readonly platform: OmniLinkPlatform) {
    super();
    this.setMaxListeners(150);
    this.session = new OmniSession(platform);
    this._omniObjects = {};
    this._troubles = [];
    this._statusCache = new NodeCache();
  }

  get model(): string {
    return this._model ?? '';
  }

  get version(): string {
    return this._version ?? '';
  }

  get temperatureFormat(): TemperatureFormats {
    return this._temperatureFormat ?? TemperatureFormats.Celsius;
  }

  get areas(): Map<number, AreaPropertiesResponse> {
    return <Map<number, AreaPropertiesResponse>>this._omniObjects[ObjectTypes.Area];
  }

  get zones(): Map<number, ZonePropertiesResponse> {
    return <Map<number, ZonePropertiesResponse>>this._omniObjects[ObjectTypes.Zone];
  }

  get units(): Map<number, UnitPropertiesResponse> {
    return <Map<number, UnitPropertiesResponse>>this._omniObjects[ObjectTypes.Unit];
  }

  get buttons(): Map<number, ButtonPropertiesResponse> {
    return <Map<number, ButtonPropertiesResponse>>this._omniObjects[ObjectTypes.Button];
  }

  get codes(): Map<number, CodePropertiesResponse> {
    return <Map<number, CodePropertiesResponse>>this._omniObjects[ObjectTypes.Code];
  }

  get thermostats(): Map<number, ThermostatPropertiesResponse> {
    return <Map<number, ThermostatPropertiesResponse>>this._omniObjects[ObjectTypes.Thermostat];
  }

  get accessControls(): Map<number, AccessControlPropertiesResponse> {
    return <Map<number, AccessControlPropertiesResponse>>this._omniObjects[ObjectTypes.AccessControlLock];
  }

  get auxiliarySensors(): Map<number, AuxiliarySensorPropertiesResponse> {
    return <Map<number, AuxiliarySensorPropertiesResponse>>this._omniObjects[ObjectTypes.AuxiliarySensor];
  }

  async init(): Promise<void> {
    this.platform.log.debug(this.constructor.name, 'init');

    try {
      let connected = false;
      while(!connected) {
        try {
          await this.session.openConnection();
          connected = true;
        } catch(error) {
          this.platform.log.warn(`Connection to controller failed: ${error.message}`);
          this.platform.log.warn('Will try again in 1 minute');
          this.session.closeConnection();
          await this.delay(60000);
        }
      }

      this.session.once('tcp-error', this.handleTcpError.bind(this));
      
      await this.session.startSession();

      await this.notify();

      // Check for system troubles (also ping controller so it doesn't close connection)
      this.pingIntervalId = setInterval(() => {
        this.reportSystemTroubles();
      }, 60000); // every minute

      // Sync time
      if (this.platform.settings.syncTime) {
        await this.setTime();
        this.syncTimeIntervalId = setInterval(async () => {
          await this.setTime();
        }, 3600000); // every hour
      }

      this.emit('initialised');
    } catch(error) {
      this.platform.log.error(error);
      throw error;      
    }
  }

  private async handleTcpError(error: Error): Promise<void> {
    this.platform.log.warn(`TCP Connection: Error [${error.message}]`);
    this.platform.log.warn('Attempting to reconnect');
    this.terminate();
    await this.init();
    await this.refreshAllStatuses();
  }

  terminate(): void {
    this.platform.log.debug(this.constructor.name, 'terminate');

    if (this.pingIntervalId) {
      clearInterval(this.pingIntervalId);
      this.pingIntervalId = undefined;
    }

    if (this.syncTimeIntervalId) {
      clearInterval(this.syncTimeIntervalId);
      this.syncTimeIntervalId = undefined;
    }

    this.session.closeConnection();
  }

  async discover(devices?: Devices): Promise<void> {
    this.platform.log.debug(this.constructor.name, 'discover', devices);

    const systemInformation = await this.getSystemInformation();
    if (systemInformation) {
      this._model = systemInformation.model;
      this._version = systemInformation.version;
    }

    const systemFormats = await this.getSystemFormats();
    if (systemFormats) {
      this._temperatureFormat = systemFormats.temperatureFormat;
    }

    this._omniObjects[ObjectTypes.Area] = await this.getAreas(devices?.['areas']);
    this._omniObjects[ObjectTypes.Zone] = await this.getZones(devices?.['zones']);
    this._omniObjects[ObjectTypes.Unit] = await this.getUnits(devices?.['units']);
    this._omniObjects[ObjectTypes.Button] = await this.getButtons(devices?.['buttons']);
    this._omniObjects[ObjectTypes.Code] = await this.getCodes(devices?.['codes']);
    this._omniObjects[ObjectTypes.Thermostat] = await this.getThermostats(devices?.['thermostats']);
    this._omniObjects[ObjectTypes.AccessControlLock] = await this.getAccessControls(devices?.['accessControls']);
    this._omniObjects[ObjectTypes.AuxiliarySensor] = await this.getAuxiliarySensors();

    // Event Handlers
    this.session.on('areas', this.processStatus.bind(this, ObjectTypes.Area));
    this.session.on('zones', this.processStatus.bind(this, ObjectTypes.Zone));
    this.session.on('units', this.processStatus.bind(this, ObjectTypes.Unit));
    this.session.on('thermostats', this.processStatus.bind(this, ObjectTypes.Thermostat));
    this.session.on('locks', this.processStatus.bind(this, ObjectTypes.AccessControlLock));
    this.session.on('sensors', this.processStatus.bind(this, ObjectTypes.AuxiliarySensor));
  }

  async getAreas(areaIds?: number[]): Promise<Map<number, AreaPropertiesResponse>> {
    this.platform.log.debug(this.constructor.name, 'getAreas', areaIds);

    const areas = new Map<number, AreaPropertiesResponse>();
    try {
      areaIds = areaIds ?? await this.getObjectIds(ObjectTypes.Area);
      for(const id of areaIds) {
        const properties = await this.getAreaProperties(id);
        if (properties !== undefined && properties.enabled) {
          areas.set(id, properties);
        }
      }
    } catch(error) {
      this.platform.log.error(error);
      throw error;      
    }

    return areas;
  }

  async getAreaProperties(id: number): Promise<AreaPropertiesResponse | undefined> {
    this.platform.log.debug(this.constructor.name, 'getAreaProperties', id);

    const message = new ObjectPropertiesRequest({
      objectType: ObjectTypes.Area,
      index: id,
      relativeDirection: 0,
      filter1: 0,
      filter2: 0,
      filter3: 0,
    });

    const response = await this.session.sendApplicationDataMessage(message);

    if (response.type === MessageTypes.ObjectPropertiesResponse) {
      this._statusCache.set(AreaStatus.getKey(id), (<AreaPropertiesResponse>response).status);
      return <AreaPropertiesResponse>response;
    }
  }

  async getZones(zoneIds?: number[]): Promise<Map<number, ZonePropertiesResponse>> {
    this.platform.log.debug(this.constructor.name, 'getZones', zoneIds);

    const zones = new Map<number, ZonePropertiesResponse>();
    try {
      zoneIds = zoneIds ?? await this.getObjectIds(ObjectTypes.Zone);
      for(const id of zoneIds) {
        const properties = await this.getZoneProperties(id);
        if (properties !== undefined) {
          zones.set(id, properties);
        }
      }
    } catch(error) {
      this.platform.log.error(error);
      throw error;      
    }

    return zones;
  }

  async getZoneProperties(id: number): Promise<ZonePropertiesResponse | undefined> {
    this.platform.log.debug(this.constructor.name, 'getZoneProperties', id);

    const message = new ObjectPropertiesRequest({
      objectType: ObjectTypes.Zone,
      index: id,
      relativeDirection: 0,
      filter1: 1, // Named zones only
      filter2: 0,
      filter3: 0,
    });

    const response = await this.session.sendApplicationDataMessage(message);

    if (response.type === MessageTypes.ObjectPropertiesResponse) {
      this._statusCache.set(ZoneStatus.getKey(id), (<ZonePropertiesResponse>response).status);
      return <ZonePropertiesResponse>response;
    }
  }

  async getUnits(unitIds?: number[]): Promise<Map<number, UnitPropertiesResponse>> {
    this.platform.log.debug(this.constructor.name, 'getUnits', unitIds);

    const units = new Map<number, UnitPropertiesResponse>();
    try {
      unitIds = unitIds ?? await this.getObjectIds(ObjectTypes.Unit);
      for(const id of unitIds) {
        const properties = await this.getUnitProperties(id);
        if (properties !== undefined) {
          units.set(id, properties);
        }
      }
    } catch(error) {
      this.platform.log.error(error);
      throw error;      
    }

    return units;
  }

  async getUnitProperties(id: number): Promise<UnitPropertiesResponse | undefined> {
    this.platform.log.debug(this.constructor.name, 'getUnitProperties', id);

    const message = new ObjectPropertiesRequest({
      objectType: ObjectTypes.Unit,
      index: id,
      relativeDirection: 0,
      filter1: 1, // Named units only
      filter2: 0,
      filter3: 0,
    });

    const response = await this.session.sendApplicationDataMessage(message);

    if (response.type === MessageTypes.ObjectPropertiesResponse) {
      this._statusCache.set(UnitStatus.getKey(id), (<UnitPropertiesResponse>response).status);
      return <UnitPropertiesResponse>response;
    }
  }

  async getButtons(buttonIds?: number[]): Promise<Map<number, ButtonPropertiesResponse>> {
    this.platform.log.debug(this.constructor.name, 'getButtons', buttonIds);

    const buttons = new Map<number, ButtonPropertiesResponse>();
    try {
      buttonIds = buttonIds ?? await this.getObjectIds(ObjectTypes.Button);
      for(const id of buttonIds) {
        const properties = await this.getButtonProperties(id);
        if (properties !== undefined) {
          buttons.set(id, properties);
        }
      }
    } catch(error) {
      this.platform.log.error(error);
      throw error;      
    }

    return buttons;
  }

  async getButtonProperties(id: number): Promise<ButtonPropertiesResponse | undefined> {
    this.platform.log.debug(this.constructor.name, 'getButtonProperties', id);

    const message = new ObjectPropertiesRequest({
      objectType: ObjectTypes.Button,
      index: id,
      relativeDirection: 0,
      filter1: 1, // Named buttons only
      filter2: 0,
      filter3: 0,
    });

    const response = await this.session.sendApplicationDataMessage(message);

    if (response.type === MessageTypes.ObjectPropertiesResponse) {
      return <ButtonPropertiesResponse>response;
    }
  }

  async getCodes(codeIds?: number[]): Promise<Map<number, CodePropertiesResponse>> {
    this.platform.log.debug(this.constructor.name, 'getCodes', codeIds);

    const codes = new Map<number, CodePropertiesResponse>();
    try {
      codeIds = codeIds ?? await this.getObjectIds(ObjectTypes.Code);
      for(const id of codeIds) {
        const properties = await this.getCodeProperties(id);
        if (properties !== undefined) {
          codes.set(id, properties);
        }
      }
    } catch(error) {
      this.platform.log.error(error);
      throw error;      
    }

    return codes;
  }

  async getCodeProperties(id: number): Promise<CodePropertiesResponse | undefined> {
    this.platform.log.debug(this.constructor.name, 'getCodeProperties', id);

    const message = new ObjectPropertiesRequest({
      objectType: ObjectTypes.Code,
      index: id,
      relativeDirection: 0,
      filter1: 1, // Named codes only
      filter2: 0,
      filter3: 0,
    });

    const response = await this.session.sendApplicationDataMessage(message);

    if (response.type === MessageTypes.ObjectPropertiesResponse) {
      return <CodePropertiesResponse>response;
    }
  }

  async getThermostats(thermostatIds?: number[]): Promise<Map<number, ThermostatPropertiesResponse>> {
    this.platform.log.debug(this.constructor.name, 'getThermostats', thermostatIds);

    const thermostats = new Map<number, ThermostatPropertiesResponse>();
    try {
      thermostatIds = thermostatIds ?? await this.getObjectIds(ObjectTypes.Thermostat);
      for(const id of thermostatIds) {
        const properties = await this.getThermostatProperties(id);
        if (properties !== undefined) {
          thermostats.set(id, properties);
        }
      }
    } catch(error) {
      this.platform.log.error(error);
      throw error;      
    }

    return thermostats;
  }

  async getThermostatProperties(id: number): Promise<ThermostatPropertiesResponse | undefined> {
    this.platform.log.debug(this.constructor.name, 'getThermostatProperties', id);

    const message = new ObjectPropertiesRequest({
      objectType: ObjectTypes.Thermostat,
      index: id,
      relativeDirection: 0,
      filter1: 1, // Named thermostats only
      filter2: 0,
      filter3: 0,
    });

    const response = await this.session.sendApplicationDataMessage(message);

    if (response.type === MessageTypes.ObjectPropertiesResponse) {
      this._statusCache.set(ThermostatStatus.getKey(id), (<ThermostatPropertiesResponse>response).status);
      return <ThermostatPropertiesResponse>response;
    }
  }

  async getAccessControls(accessControlIds?: number[]): Promise<Map<number, AccessControlPropertiesResponse>> {
    this.platform.log.debug(this.constructor.name, 'getAccessControls', accessControlIds);

    const accessControls = new Map<number, AccessControlPropertiesResponse>();
    try {
      accessControlIds = accessControlIds ?? await this.getObjectIds(ObjectTypes.AccessControlReader);
      for(const id of accessControlIds) {
        const properties = await this.getAccessControlProperties(id);
        if (properties !== undefined) {
          accessControls.set(id, properties);
        }
      }
    } catch(error) {
      this.platform.log.error(error);
      throw error;      
    }

    return accessControls;
  }

  async getAccessControlProperties(id: number): Promise<AccessControlPropertiesResponse | undefined> {
    this.platform.log.debug(this.constructor.name, 'getAccessControlProperties', id);

    const message = new ObjectPropertiesRequest({
      objectType: ObjectTypes.AccessControlReader,
      index: id,
      relativeDirection: 0,
      filter1: 1, // Named access controls only
      filter2: 0,
      filter3: 0,
    });

    const response = await this.session.sendApplicationDataMessage(message);

    if (response.type === MessageTypes.ObjectPropertiesResponse) {
      this._statusCache.set(AccessControlLockStatus.getKey(id), (<AccessControlPropertiesResponse>response).status);
      return <AccessControlPropertiesResponse>response;
    }
  }

  async getAuxiliarySensors(): Promise<Map<number, AuxiliarySensorPropertiesResponse>> {
    this.platform.log.debug(this.constructor.name, 'getAuxiliarySensors');

    const sensors = new Map<number, AuxiliarySensorPropertiesResponse>();
    try {
      for(const id of this.getAuxiliarySensorIdsFromZones()) {
        const properties = await this.getAuxiliarySensorsProperties(id);
        if (properties !== undefined) {
          sensors.set(id, properties);
        }
      }
    } catch(error) {
      this.platform.log.error(error);
      throw error;      
    }

    return sensors;
  }

  private getAuxiliarySensorIdsFromZones(): number[] {
    const auxiliarySensorTypes = [
      ZoneTypes.OutdoorTemperature,
      ZoneTypes.Temperature,
      ZoneTypes.TemperatureAlarm,
      ZoneTypes.Humidity,
      ZoneTypes.ExtendedRangeOutdoorTemperature,
      ZoneTypes.ExtendedRangeTemperature,
      ZoneTypes.ExtendedRangeTemperatureAlarm,
    ];

    const sensorIds: number[] = [];

    for(const [zoneId, zone] of this.zones.entries()) {
      if (auxiliarySensorTypes.includes(zone.zoneType)) {
        sensorIds.push(zoneId);
      }
    }

    return sensorIds;
  }

  async getAuxiliarySensorsProperties(id: number): Promise<AuxiliarySensorPropertiesResponse | undefined> {
    this.platform.log.debug(this.constructor.name, 'getAuxiliarySensorsProperties', id);

    const message = new ObjectPropertiesRequest({
      objectType: ObjectTypes.AuxiliarySensor,
      index: id,
      relativeDirection: 0,
      filter1: 0, // Named or unnamed Auxiliary Sensors
      filter2: 0,
      filter3: 0,
    });

    const response = await this.session.sendApplicationDataMessage(message);

    if (response.type === MessageTypes.ObjectPropertiesResponse) {
      this._statusCache.set(AuxiliarySensorStatus.getKey(id), (<AuxiliarySensorPropertiesResponse>response).status);
      return <AuxiliarySensorPropertiesResponse>response;
    }
  }

  async setTime(): Promise<void> {
    this.platform.log.debug(this.constructor.name, 'setTime');

    try {
      const status = await this.getSystemStatus();
      let now = new Date();

      if (Math.abs(status!.dateTime.getTime() - now.getTime()) <= 60000 && status!.isDaylightSavings === this.isDaylightSavings(now) ) {
        return;
      }

      this.platform.log.info(`Sync Time: Omni Controller ${status!.dateTime.toLocaleString()}, Host ${now.toLocaleString()}`);

      // Round to nearest minute
      now = new Date(Math.round((new Date()).getTime() / 60000) * 60000);

      const message = new SetTimeCommandRequest({
        year: now.getFullYear() - 2000,
        month: now.getMonth() + 1,
        day: now.getDate(),
        dayOfWeek: now.getDay() + 1,
        hour: now.getHours(),
        minute: now.getMinutes(),
        daylightSavings: this.isDaylightSavings(now) ? 1 : 0,
      });
  
      const response = await this.session.sendApplicationDataMessage(message);

      if (response.type !== MessageTypes.Acknowledge) {
        throw new Error('Acknowledgement not received');
      }
    } catch(error) {
      this.platform.log.warn(`Set Time failed: ${error.message}`);
    }
  }

  private isDaylightSavings(date: Date) {
    const jan = new Date(date.getFullYear(), 0, 1).getTimezoneOffset();
    const jul = new Date(date.getFullYear(), 6, 1).getTimezoneOffset();
    return Math.max(jan, jul) !== date.getTimezoneOffset(); 
  }

  async executeButton(buttonId: number): Promise<void> {
    this.platform.log.debug(this.constructor.name, 'executeButton', buttonId);

    try {
      const message = new ControllerCommandRequest({
        command: Commands.ExecuteButton,
        parameter1: 0,
        parameter2: buttonId,
      });

      if (this.platform.settings.showOmniEvents) {
        const prefix = this.getLogMessagePrefix(ObjectTypes.Button, buttonId);
        this.platform.log.info(`${prefix} Execute Button`);
      }
  
      const response = await this.session.sendApplicationDataMessage(message);

      this.emit(`button-${buttonId}`);

      if (response.type !== MessageTypes.Acknowledge) {
        throw new Error('Acknowledgement not received');
      }
    } catch(error) {
      const prefix = this.getLogMessagePrefix(ObjectTypes.Button, buttonId);
      this.platform.log.warn(`${prefix} Execute Button failed [${error.message}]`);
    }
  }

  async setZoneBypass(zoneId: number, state: boolean): Promise<void> {
    this.platform.log.debug(this.constructor.name, 'setZoneBypass', zoneId, state);

    try {
      const areaId = this.zones.get(zoneId)!.areaId;
      const codeId = await this.getCodeId(areaId);
      if (codeId === undefined) {
        return;
      }

      const message = new ControllerCommandRequest({
        command: state ? Commands.BypassZone : Commands.RestoreZone,
        parameter1: codeId,
        parameter2: zoneId,
      });

      if (this.platform.settings.showOmniEvents) {
        const prefix = this.getLogMessagePrefix(ObjectTypes.Zone, zoneId);
        this.platform.log.info(`${prefix} Set Bypass ${state ? 'On' : 'Off'} [${this.codes.get(codeId)?.name}]`);
      }
  
      const response = await this.session.sendApplicationDataMessage(message);

      if (response.type !== MessageTypes.Acknowledge) {
        throw new Error('Acknowledgement not received');
      }
    } catch(error) {
      const prefix = this.getLogMessagePrefix(ObjectTypes.Zone, zoneId);
      this.platform.log.warn(`${prefix} Set Bypass failed [${error.message}]`);
    }
  }

  async setUnitState(unitId: number, state: boolean): Promise<void> {
    this.platform.log.debug(this.constructor.name, 'setUnitState', unitId, state);

    try {
      const message = new ControllerCommandRequest({
        command: state ? Commands.UnitOn : Commands.UnitOff,
        parameter1: 0,
        parameter2: unitId,
      });

      if (this.platform.settings.showOmniEvents) {
        const prefix = this.getLogMessagePrefix(ObjectTypes.Unit, unitId);
        this.platform.log.info(`${prefix} Set State ${state ? 'On' : 'Off'}`);
      }
  
      const response = await this.session.sendApplicationDataMessage(message);

      if (response.type !== MessageTypes.Acknowledge) {
        throw new Error('Acknowledgement not received');
      }
    } catch(error) {
      const prefix = this.getLogMessagePrefix(ObjectTypes.Unit, unitId);
      this.platform.log.warn(`${prefix} Set State failed [${error.message}]`);
    }
  }

  async setUnitBrightness(unitId: number, brightness: number): Promise<void> {
    this.platform.log.debug(this.constructor.name, 'setUnitBrightness', unitId, brightness);

    try {
      if (brightness < 0) {
        brightness = 0;
      } else if (brightness > 100) {
        brightness = 100;
      } else {
        brightness = Math.round(brightness);
      }

      const message = new ControllerCommandRequest({
        command: Commands.UnitLightingLevel,
        parameter1: brightness,
        parameter2: unitId,
      });

      if (this.platform.settings.showOmniEvents) {
        const prefix = this.getLogMessagePrefix(ObjectTypes.Unit, unitId);
        this.platform.log.info(`${prefix} Set Lighting Level ${brightness}%`);
      }
  
      const response = await this.session.sendApplicationDataMessage(message);

      if (response.type !== MessageTypes.Acknowledge) {
        throw new Error('Acknowledgement not received');
      }
    } catch(error) {
      const prefix = this.getLogMessagePrefix(ObjectTypes.Unit, unitId);
      this.platform.log.warn(`${prefix} Set Lighting Level failed [${error.message}]`);
    }
  }
  
  async setThermostatHeatSetPoint(thermostatId: number, temperature: number): Promise<void> { // temperature is in Celcius
    this.platform.log.debug(this.constructor.name, 'setThermostatHeatSetPoint', thermostatId, temperature);

    try {
      const message = new ControllerCommandRequest({
        command: Commands.SetHeatSetPoint,
        parameter1: this.convertToOmniTemperature(temperature),
        parameter2: thermostatId,
      });

      if (this.platform.settings.showOmniEvents) {
        const prefix = this.getLogMessagePrefix(ObjectTypes.Thermostat, thermostatId);
        this.platform.log.info(`${prefix} Set Heat SetPoint ${this.formatTemperature(temperature)}`);
      }
  
      const response = await this.session.sendApplicationDataMessage(message);

      if (response.type !== MessageTypes.Acknowledge) {
        throw new Error('Acknowledgement not received');
      }
    } catch(error) {
      const prefix = this.getLogMessagePrefix(ObjectTypes.Thermostat, thermostatId);
      this.platform.log.warn(`${prefix} Set Heat SetPoint failed [${error.message}]`);
    }
  }

  async setThermostatCoolSetPoint(thermostatId: number, temperature: number): Promise<void> { // temperature is in Celcius
    this.platform.log.debug(this.constructor.name, 'setThermostatCoolSetPoint', thermostatId, temperature);

    try {
      const message = new ControllerCommandRequest({
        command: Commands.SetCoolSetPoint,
        parameter1: this.convertToOmniTemperature(temperature),
        parameter2: thermostatId,
      });

      if (this.platform.settings.showOmniEvents) {
        const prefix = this.getLogMessagePrefix(ObjectTypes.Thermostat, thermostatId);
        this.platform.log.info(`${prefix} Set Cool SetPoint ${this.formatTemperature(temperature)}`);
      }
  
      const response = await this.session.sendApplicationDataMessage(message);

      if (response.type !== MessageTypes.Acknowledge) {
        throw new Error('Acknowledgement not received');
      }
    } catch(error) {
      const prefix = this.getLogMessagePrefix(ObjectTypes.Thermostat, thermostatId);
      this.platform.log.warn(`${prefix} Set Cool SetPoint failed [${error.message}]`);
    }
  }

  async setThermostatMode(thermostatId: number, mode: ThermostatModes): Promise<void> {
    this.platform.log.debug(this.constructor.name, 'setThermostatMode', thermostatId, mode);

    try {
      const message = new ControllerCommandRequest({
        command: Commands.SetThermostatMode,
        parameter1: mode,
        parameter2: thermostatId,
      });

      if (this.platform.settings.showOmniEvents) {
        const prefix = this.getLogMessagePrefix(ObjectTypes.Thermostat, thermostatId);
        this.platform.log.info(`${prefix} Set Mode ${ThermostatModes[mode]}`);
      }
  
      const response = await this.session.sendApplicationDataMessage(message);

      if (response.type !== MessageTypes.Acknowledge) {
        throw new Error('Acknowledgement not received');
      }
    } catch(error) {
      const prefix = this.getLogMessagePrefix(ObjectTypes.Thermostat, thermostatId);
      this.platform.log.warn(`${prefix} Set Mode failed [${error.message}]`);
    }
  }

  async setThermostatHumidifySetPoint(thermostatId: number, humidity: number): Promise<void> {
    this.platform.log.debug(this.constructor.name, 'setThermostatHumidifySetPoint', thermostatId, humidity);

    try {
      const message = new ControllerCommandRequest({
        command: Commands.SetHumidifySetPoint,
        parameter1: this.convertToOmniHumidity(humidity),
        parameter2: thermostatId,
      });

      if (this.platform.settings.showOmniEvents) {
        const prefix = this.getLogMessagePrefix(ObjectTypes.Thermostat, thermostatId);
        this.platform.log.info(`${prefix} Set Humidity SetPoint ${humidity}`);
      }
  
      const response = await this.session.sendApplicationDataMessage(message);

      if (response.type !== MessageTypes.Acknowledge) {
        throw new Error('Acknowledgement not received');
      }
    } catch(error) {
      const prefix = this.getLogMessagePrefix(ObjectTypes.Thermostat, thermostatId);
      this.platform.log.warn(`${prefix} Set Humidity SetPoint failed [${error.message}]`);
    }
  }

  async setThermostatDehumidifySetPoint(thermostatId: number, humidity: number): Promise<void> {
    this.platform.log.debug(this.constructor.name, 'setThermostatDehumidifySetPoint', thermostatId, humidity);

    try {
      const message = new ControllerCommandRequest({
        command: Commands.SetDehumidifySetPoint,
        parameter1: this.convertToOmniHumidity(humidity),
        parameter2: thermostatId,
      });

      if (this.platform.settings.showOmniEvents) {
        const prefix = this.getLogMessagePrefix(ObjectTypes.Thermostat, thermostatId);
        this.platform.log.info(`${prefix} Set Dehumidity SetPoint ${humidity}`);
      }
  
      const response = await this.session.sendApplicationDataMessage(message);

      if (response.type !== MessageTypes.Acknowledge) {
        throw new Error('Acknowledgement not received');
      }
    } catch(error) {
      const prefix = this.getLogMessagePrefix(ObjectTypes.Thermostat, thermostatId);
      this.platform.log.warn(`${prefix} Set Dehumidity SetPoint failed [${error.message}]`);
    }
  }

  async setLockState(accessControlId: number, lock: boolean): Promise<void> {
    this.platform.log.debug(this.constructor.name, 'lockDoor', accessControlId, lock);

    try {
      const message = new ControllerCommandRequest({
        command: lock ? Commands.LockDoor : Commands.UnlockDoor,
        parameter1: 0,
        parameter2: accessControlId,
      });

      if (this.platform.settings.showOmniEvents) {
        const prefix = this.getLogMessagePrefix(ObjectTypes.AccessControlLock, accessControlId);
        this.platform.log.info(`${prefix} ${lock ? 'Lock' : 'Unlock'}`);
      }
  
      const response = await this.session.sendApplicationDataMessage(message);

      if (response.type !== MessageTypes.Acknowledge) {
        throw new Error('Acknowledgement not received');
      }
    } catch(error) {
      const prefix = this.getLogMessagePrefix(ObjectTypes.AccessControlLock, accessControlId);
      this.platform.log.warn(`${prefix} ${lock ? 'Lock' : 'Unlock'} failed [${error.message}]`);
    }
  }

  async notify(): Promise<void> {
    this.platform.log.debug(this.constructor.name, 'notify');

    try {
      const message = new EnableNotificationsRequest(true);
      const response = await this.session.sendApplicationDataMessage(message);

      if (response.type !== MessageTypes.Acknowledge) {
        throw new Error('Acknowledgement not received');
      }
    } catch(error) {
      this.platform.log.error(error);
      throw error;      
    }
  }

  // System
  async getSystemInformation(): Promise<SystemInformationResponse | undefined> {
    this.platform.log.debug(this.constructor.name, 'getSystemInformation');

    try {
      const message = new SystemInformationRequest();
      const response = await this.session.sendApplicationDataMessage(message);

      if (response.type === MessageTypes.SystemInformationResponse) {
        return <SystemInformationResponse>response;
      }
    } catch(error) {
      this.platform.log.error(error);
      throw error;      
    }
  }

  async getSystemStatus(): Promise<SystemStatusResponse | undefined> {
    this.platform.log.debug(this.constructor.name, 'getSystemStatus');

    try {
      const message = new SystemStatusRequest();
      const response = await this.session.sendApplicationDataMessage(message);

      if (response.type === MessageTypes.SystemStatusResponse) {
        return <SystemStatusResponse>response;
      }
    } catch(error) {
      this.platform.log.error(error);
      throw error;      
    }
  }

  async getSystemTroubles(): Promise<SystemTroublesResponse | undefined> {
    this.platform.log.debug(this.constructor.name, 'getSystemTroubles');

    try {
      const message = new SystemTroublesRequest();
      const response = await this.session.sendApplicationDataMessage(message);

      if (response.type === MessageTypes.SystemTroublesResponse) {
        return <SystemTroublesResponse>response;
      }
    } catch(error) {
      this.platform.log.error(error);
      throw error;      
    }
  }

  async getSystemFormats(): Promise<SystemFormatsResponse | undefined> {
    this.platform.log.debug(this.constructor.name, 'getSystemFormats');

    try {
      const message = new SystemFormatsRequest();
      const response = await this.session.sendApplicationDataMessage(message);

      if (response.type === MessageTypes.SystemFormatsResponse) {
        return <SystemFormatsResponse>response;
      }
    } catch(error) {
      this.platform.log.error(error);
      throw error;      
    }
  }

  // Object Status
  async refreshAllStatuses(): Promise<void> {
    this.platform.log.debug(this.constructor.name, 'refreshAllStatuses');

    let startId: number;
    let endId: number;
    let response: ApplicationDataResponse | undefined;

    // Areas
    if (this.areas.size > 0) {
      startId = Math.min(...this.areas.keys());
      endId = Math.max(...this.areas.keys());
      response = await this.getObjectStatus(ObjectTypes.Area, startId, endId);
      if (response instanceof ExtendedAreaStatusResponse) {
        this.processStatus(ObjectTypes.Area, response.areas);
      }
    }

    // Zones
    if (this.zones.size > 0) {
      startId = Math.min(...this.zones.keys());
      endId = Math.max(...this.zones.keys());
      response = await this.getObjectStatus(ObjectTypes.Zone, startId, endId);
      if (response instanceof ExtendedZoneStatusResponse) {
        this.processStatus(ObjectTypes.Zone, response.zones);
      }
    }

    // Units
    if (this.units.size > 0) {
      startId = Math.min(...this.units.keys());
      endId = Math.max(...this.units.keys());
      response = await this.getObjectStatus(ObjectTypes.Unit, startId, endId);
      if (response instanceof ExtendedUnitStatusResponse) {
        this.processStatus(ObjectTypes.Unit, response.units);
      }
    }

    // Thermostats
    if (this.thermostats.size > 0) {
      startId = Math.min(...this.thermostats.keys());
      endId = Math.max(...this.thermostats.keys());
      response = await this.getObjectStatus(ObjectTypes.Thermostat, startId, endId);
      if (response instanceof ExtendedThermostatStatusResponse) {
        this.processStatus(ObjectTypes.Thermostat, response.thermostats);
      }
    }

    // Access Control Lock
    if (this.accessControls.size > 0) {
      startId = Math.min(...this.accessControls.keys());
      endId = Math.max(...this.accessControls.keys());
      response = await this.getObjectStatus(ObjectTypes.AccessControlLock, startId, endId);
      if (response instanceof ExtendedAccessControlLockStatusResponse) {
        this.processStatus(ObjectTypes.AccessControlLock, response.locks);
      }
    }

    // Auxiliary Sensors
    if (this.auxiliarySensors.size > 0) {
      startId = Math.min(...this.auxiliarySensors.keys());
      endId = Math.max(...this.auxiliarySensors.keys());
      response = await this.getObjectStatus(ObjectTypes.AuxiliarySensor, startId, endId);
      if (response instanceof ExtendedAuxiliarySensorStatusResponse) {
        this.processStatus(ObjectTypes.AuxiliarySensor, response.sensors);
      }
    }
  }

  private async getObjectStatus(
    objectType: ObjectTypes, startId: number, endId: number): Promise<ApplicationDataResponse | undefined> {
    this.platform.log.debug(this.constructor.name, 'getObjectStatus', objectType, startId, endId);

    try {
      const message = new ExtendedObjectStatusRequest({
        objectType: objectType,
        startId: startId,
        endId: endId,
      });
  
      return await this.session.sendApplicationDataMessage(message);
    } catch(error) {
      this.platform.log.error(error);
    }
  }

  private processStatus(objectType: ObjectTypes, statuses: Map<number, IStatus>): void {
    this.platform.log.debug(this.constructor.name, 'processStatus', objectType, statuses);

    try {
      for(const [id, status] of statuses.entries()) {
        if (!this._omniObjects[objectType].has(id)) {
          continue;
        }
        if (status.equals(this._statusCache.get(status.getKey(id)))) {
          continue;
        }
        if (this.platform.settings.showOmniEvents) {
          this.platform.log.info(this.getOmniEventMessage(objectType, id, status));
        }
        this._statusCache.set(status.getKey(id), status);
        this.emit(status.getKey(id), status);
      }
    } catch(error) {
      this.platform.log.error(error);
    }
  }

  private getOmniEventMessage(objectType: ObjectTypes, id: number, status: IStatus): string {
    let message = this.getLogMessagePrefix(objectType, id);
    switch(objectType) {
      case ObjectTypes.Area:
        if (status instanceof AreaStatus) {
          message = `${message} ${SecurityModes[status.securityMode]}`;
          if (status.alarmsTriggered.length > 0) {
            const alarms = status.alarmsTriggered.map((alarm) => Alarms[alarm]);
            message = `${message}; Alarm(s) triggered: ${alarms.join()}`;
          }
        }
        return message;
      case ObjectTypes.Zone:
        if (status instanceof ZoneStatus) {
          return `${message} ${ZoneStates[status.currentState]}`;
        }
        break;
      case ObjectTypes.Unit:
        if (status instanceof UnitStatus) {
          return `${message} ${UnitStates[status.state]}`;
        }
        break;
      case ObjectTypes.Thermostat:
        if (status instanceof ThermostatStatus) {
          return `${message} ${this.formatTemperature(status.currentTemperature)}; ${ThermostatModes[status.mode]}`;
        }
        break;
      case ObjectTypes.AccessControlLock:
        if (status instanceof AccessControlLockStatus) {
          return `${message} ${status.locked ? 'Locked' : 'Unlocked'}`;
        }
        break;
      case ObjectTypes.AuxiliarySensor:
        if (status instanceof AuxiliarySensorStatus) {
          message += this.auxiliarySensors.get(id)!.isTemperatureSensor
            ? `${this.formatTemperature(status.temperature)}`
            : `${status.humidity}%`;
          return message;
        }
        break;
    }
    return `${message} Unsupported object type`;
  }

  async getAreaStatus(areaId: number): Promise<AreaStatus | undefined> {
    this.platform.log.debug(this.constructor.name, 'getAreaStatus', areaId);

    const status = <AreaStatus | undefined>this._statusCache.get(AreaStatus.getKey(areaId));
    if (status !== undefined) {
      return status;
    }

    const response = await this.getObjectStatus(ObjectTypes.Area, areaId, areaId);
    if (response instanceof ExtendedAreaStatusResponse) {
      const status = response.areas.get(areaId);
      this._statusCache.set(status!.getKey(areaId), status);
      return status;
    }
  }

  async getZoneStatus(zoneId: number): Promise<ZoneStatus | undefined> {
    this.platform.log.debug(this.constructor.name, 'getZoneStatus', zoneId);

    const status = <ZoneStatus | undefined>this._statusCache.get(ZoneStatus.getKey(zoneId));
    if (status !== undefined) {
      return status;
    }

    const response = await this.getObjectStatus(ObjectTypes.Zone, zoneId, zoneId);
    if (response instanceof ExtendedZoneStatusResponse) {
      const status = response.zones.get(zoneId);
      this._statusCache.set(status!.getKey(zoneId), status);
      return status;
    }
  }

  async getUnitStatus(unitId: number): Promise<UnitStatus | undefined> {
    this.platform.log.debug(this.constructor.name, 'getUnitStatus', unitId);

    const status = <UnitStatus | undefined>this._statusCache.get(UnitStatus.getKey(unitId));
    if (status !== undefined) {
      return status;
    }

    const response = await this.getObjectStatus(ObjectTypes.Unit, unitId, unitId);
    if (response instanceof ExtendedUnitStatusResponse) {
      const status = response.units.get(unitId);
      this._statusCache.set(status!.getKey(unitId), status);
      return status;
    }
  }

  async getThermostatStatus(thermostatId: number): Promise<ThermostatStatus | undefined> {
    this.platform.log.debug(this.constructor.name, 'getThermostatStatus', thermostatId);

    const status = <ThermostatStatus | undefined>this._statusCache.get(ThermostatStatus.getKey(thermostatId));
    if (status !== undefined) {
      return status;
    }

    const response = await this.getObjectStatus(ObjectTypes.Thermostat, thermostatId, thermostatId);
    if (response instanceof ExtendedThermostatStatusResponse) {
      const status = response.thermostats.get(thermostatId);
      this._statusCache.set(status!.getKey(thermostatId), status);
      return status;
    }
  }

  async getLockStatus(lockId: number): Promise<AccessControlLockStatus | undefined> {
    this.platform.log.debug(this.constructor.name, 'getLockStatus', lockId);

    const status = <AccessControlLockStatus | undefined>this._statusCache.get(AccessControlLockStatus.getKey(lockId));
    if (status !== undefined) {
      return status;
    }

    const response = await this.getObjectStatus(ObjectTypes.AccessControlLock, lockId, lockId);
    if (response instanceof ExtendedAccessControlLockStatusResponse) {
      const status = response.locks.get(lockId);
      this._statusCache.set(status!.getKey(lockId), status);
      return status;
    }
  }

  async getAuxiliarySensorStatus(auxiliarySensorId: number): Promise<AuxiliarySensorStatus | undefined> {
    this.platform.log.debug(this.constructor.name, 'getAuxiliarySensorStatus', auxiliarySensorId);

    const status = <AuxiliarySensorStatus | undefined>this._statusCache.get(AuxiliarySensorStatus.getKey(auxiliarySensorId));
    if (status !== undefined) {
      return status;
    }

    const response = await this.getObjectStatus(ObjectTypes.AuxiliarySensor, auxiliarySensorId, auxiliarySensorId);
    if (response instanceof ExtendedAuxiliarySensorStatusResponse) {
      const status = response.sensors.get(auxiliarySensorId);
      this._statusCache.set(status!.getKey(auxiliarySensorId), status);
      return status;
    }
  }

  async setAreaAlarmMode(areaId: number, mode: ArmedModes | ExtendedArmedModes): Promise<void> {
    this.platform.log.debug(this.constructor.name, 'setAlarmState', areaId, mode);

    try {
      const codeId = await this.getCodeId(areaId);
      if (codeId === undefined) {
        return;
      }

      const command: Commands = this.getAreaArmCommand(mode);

      if (this.platform.settings.showOmniEvents) {
        const prefix = this.getLogMessagePrefix(ObjectTypes.Area, areaId);
        this.platform.log.info(`${prefix} Set Mode ${Commands[command]} [${this.codes.get(codeId)?.name}]`);
      }

      const message = new ControllerCommandRequest({
        command: command,
        parameter1: codeId,
        parameter2: areaId,
      });
  
      const response = await this.session.sendApplicationDataMessage(message);

      if (response.type !== MessageTypes.Acknowledge) {
        throw new Error('Acknowledgement not received');
      }
    } catch(error) {
      const prefix = this.getLogMessagePrefix(ObjectTypes.Area, areaId);
      this.platform.log.warn(`${prefix} Set Mode failed [${error.message}]`);
    }
  }

  private getAreaArmCommand(mode: number): Commands {
    switch(mode) {

      case ExtendedArmedModes.ArmedDay:
        return Commands.ArmDay;
      case ExtendedArmedModes.ArmedNight:
        return Commands.ArmNight;
      case ExtendedArmedModes.ArmedAway:
        return Commands.ArmAway;
      case ExtendedArmedModes.ArmedVacation:
        return Commands.ArmVacation;
      case ExtendedArmedModes.ArmedDayInstant:
        return Commands.ArmDayInstant;
      case ExtendedArmedModes.ArmedNightDelayed:
        return Commands.ArmNightDelayed;
      default:
        return Commands.Disarm;
    }
  }

  private async getCodeId(areaId: number): Promise<number | undefined> {
    this.platform.log.debug(this.constructor.name, 'getCodeId', areaId);

    try {
      const message = new SecurityCodeValidationRequest({
        areaId: areaId,
        code: this.platform.settings.securityCode,
      });
  
      const response = await this.session.sendApplicationDataMessage(message);

      if (!(response instanceof SecurityCodeValidationResponse)) {
        throw new Error('SecurityCodeValidationResponse not received');
      }

      if (response.authorityLevel === AuthorityLevels.InvalidCode) {
        throw new Error('Security code is invalid');
      }

      return response.codeId;

    } catch(error) {
      this.platform.log.warn(`Get Code Id failed [${error.message}]`);
    }
  }

  private async reportSystemTroubles() {
    this.platform.log.debug(this.constructor.name, 'reportSystemTroubles');

    try {
      const response = await this.getSystemTroubles();

      if (!(response instanceof SystemTroublesResponse)) {
        throw new Error('SystemTroublesResponse not received');
      }

      this.emit('system-troubles', response.troubles);
      for(const trouble of response.troubles) {
        if (!this._troubles.includes(trouble)) {
          this.platform.log.warn(`Trouble: ${SystemTroubles[trouble]}`);
          this.emit('system-trouble', trouble);
        }
      }

      this._troubles = [...response.troubles];
    } catch(error) {
      this.platform.log.warn(`Report System Troubles failed [${error.message}]`);
    }
  }

  async setEmergencyAlarm(areaId: number, emergencyType: EmergencyTypes): Promise<void> {
    this.platform.log.debug(this.constructor.name, 'setEmergencyAlarm', areaId, emergencyType);

    try {
      if (this.platform.settings.showOmniEvents) {
        const prefix = this.getLogMessagePrefix(ObjectTypes.Area, areaId);
        this.platform.log.info(`${prefix} Set Emergency Alarm [${EmergencyTypes[emergencyType]}]`);
      }

      const message = new KeypadEmergencyRequest({
        areaId: areaId,
        emergencyType: emergencyType,
      });
  
      const response = await this.session.sendApplicationDataMessage(message);

      if (response.type !== MessageTypes.Acknowledge) {
        throw new Error('Acknowledgement not received');
      }
    } catch(error) {
      const prefix = this.getLogMessagePrefix(ObjectTypes.Area, areaId);
      this.platform.log.warn(`${prefix} Set Emergency Alarm failed [${error.message}]`);
    }
  }

  // Helpers
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => {
      setTimeout(resolve, ms);
    });
  }

  private async getObjectIds(objectType: ObjectTypes): Promise<number[]> {
    const message = new ObjectTypeCapacitiesRequest({
      objectType: objectType,
    });
    const response = await this.session.sendApplicationDataMessage(message);
    const capacity = response instanceof ObjectTypeCapacitiesResponse
      ? response.capacity
      : 0;

    return [...Array(capacity).keys()].map(i => ++i);
  }

  private convertToOmniTemperature(temperature: number): number {
    let omniTemperature = (40 + temperature) * 2;
    if (omniTemperature < 44) {
      omniTemperature = 44;
    } else if (omniTemperature > 180) {
      omniTemperature = 180;
    }
    return omniTemperature;
  }

  private convertToOmniHumidity(humidity: number): number {
    if (humidity <= 0) {
      return 44;
    } else if (humidity >= 100) {
      return 156;
    } else {
      return 44 + Math.round(humidity / 100.0 * 112.0);
    }
  }

  private formatTemperature(celcius: number): string {
    if (this.temperatureFormat === TemperatureFormats.Celsius) {
      return `${celcius.toFixed(1)}C`;
    } else {
      const fahrenheit = (celcius * 9.0 / 5.0) + 32.0;
      return `${fahrenheit.toFixed(1)}F`;
    }
  }

  private getLogMessagePrefix(objectType: ObjectTypes, id: number): string {
    return `${ObjectTypes[objectType]} ${id} [${this._omniObjects[objectType].get(id)!.name}]:`;
  }
}