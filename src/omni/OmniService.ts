import events = require('events');

import { OmniLinkPlatform } from '../platform';
import { OmniSession } from './OmniSession';

import { MessageTypes, ObjectTypes, Commands, SecurityModes, Alarms, AuthorityLevels, SystemTroubles, EmergencyTypes}
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
import { AuxiliarySensorPropertiesResponse, SensorTypes } from './messages/AuxiliarySensorPropertiesResponse';
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

import { AreaStatus, ArmedModes, ExtendedArmedModes } from '../models/AreaStatus';
import { ZoneStatus, ZoneStates } from '../models/ZoneStatus';
import { UnitStatus, UnitStates } from '../models/UnitStatus';
import { ThermostatStatus, ThermostatModes } from '../models/ThermostatStatus';
import { AccessControlLockStatus } from '../models/AccessControlLockStatus';
import { AuxiliarySensorStatus } from '../models/AuxiliarySensorStatus';

export { ZoneTypes } from './messages/ZonePropertiesResponse';

export type Devices = {
  areas: number[],
  zones: number[],
  units: number[],
  buttons: number[],
  thermostats: number[],
  codes: number[],
  accessControls: number[],
  auxiliarySensors: number[]
}

export class OmniService extends events.EventEmitter {
  private readonly session: OmniSession;
  private pingIntervalId?: NodeJS.Timeout;
  private syncTimeIntervalId?: NodeJS.Timeout;
  private _model?: string;
  private _version?: string;
  private _temperatureFormat?: TemperatureFormats;
  private _zones: Map<number, ZonePropertiesResponse>;
  private _units: Map<number, UnitPropertiesResponse>;
  private _areas: Map<number, AreaPropertiesResponse>;
  private _buttons: Map<number, ButtonPropertiesResponse>;
  private _codes: Map<number, CodePropertiesResponse>;
  private _thermostats: Map<number, ThermostatPropertiesResponse>;
  private _accessControls: Map<number, AccessControlPropertiesResponse>;
  private _auxiliarySensors: Map<number, AuxiliarySensorPropertiesResponse>;
  private _troubles: SystemTroubles[];

  constructor(private readonly platform: OmniLinkPlatform) {
    super();
    this.session = new OmniSession(platform);
    this._zones = new Map<number, ZonePropertiesResponse>();
    this._units = new Map<number, UnitPropertiesResponse>();
    this._areas = new Map<number, AreaPropertiesResponse>();
    this._buttons = new Map<number, ButtonPropertiesResponse>();
    this._codes = new Map<number, CodePropertiesResponse>();
    this._thermostats = new Map<number, ThermostatPropertiesResponse>();
    this._accessControls = new Map<number, AccessControlPropertiesResponse>();
    this._auxiliarySensors = new Map<number, AuxiliarySensorPropertiesResponse>();
    this._troubles = [];
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

  get zones(): Map<number, ZonePropertiesResponse> {
    return this._zones;
  }

  get units(): Map<number, UnitPropertiesResponse> {
    return this._units;
  }

  get areas(): Map<number, AreaPropertiesResponse> {
    return this._areas;
  }

  get buttons(): Map<number, ButtonPropertiesResponse> {
    return this._buttons;
  }

  get codes(): Map<number, CodePropertiesResponse> {
    return this._codes;
  }

  get thermostats(): Map<number, ThermostatPropertiesResponse> {
    return this._thermostats;
  }

  get accessControls(): Map<number, AccessControlPropertiesResponse> {
    return this._accessControls;
  }

  get auxiliarySensors(): Map<number, AuxiliarySensorPropertiesResponse> {
    return this._auxiliarySensors;
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

    this._areas = await this.getAreas(devices?.['areas']);
    this._zones = await this.getZones(devices?.['zones']);
    this._units = await this.getUnits(devices?.['units']);
    this._buttons = await this.getButtons(devices?.['buttons']);
    this._thermostats = await this.getThermostats(devices?.['thermostats']);
    this._codes = await this.getCodes(devices?.['codes']);
    this._accessControls = await this.getAccessControls(devices?.['accessControls']);
    this._auxiliarySensors = await this.getAuxiliarySensors(devices?.['auxiliarySensors']);

    // Event Handlers
    this.session.on('areas', this.areaStatusHandler.bind(this));
    this.session.on('zones', this.zoneStatusHandler.bind(this));
    this.session.on('units', this.unitStatusHandler.bind(this));
    this.session.on('thermostats', this.thermostatStatusHandler.bind(this));
    this.session.on('locks', this.lockStatusHandler.bind(this));
    this.session.on('sensors', this.auxiliarySensorStatusHandler.bind(this));
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
      return <AccessControlPropertiesResponse>response;
    }
  }

  async getAuxiliarySensors(auxiliarySensorIds?: number[]): Promise<Map<number, AuxiliarySensorPropertiesResponse>> {
    this.platform.log.debug(this.constructor.name, 'getAuxiliarySensors', auxiliarySensorIds);

    const sensors = new Map<number, AuxiliarySensorPropertiesResponse>();
    try {
      auxiliarySensorIds = auxiliarySensorIds ?? await this.getObjectIds(ObjectTypes.AuxiliarySensor);

      for(const id of auxiliarySensorIds) {
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

  async getAuxiliarySensorsProperties(id: number): Promise<AuxiliarySensorPropertiesResponse | undefined> {
    this.platform.log.debug(this.constructor.name, 'getAuxiliarySensorsProperties', id);

    const message = new ObjectPropertiesRequest({
      objectType: ObjectTypes.AuxiliarySensor,
      index: id,
      relativeDirection: 0,
      filter1: 1, // Named Auxiliary Sensors only
      filter2: 0,
      filter3: 0,
    });

    const response = await this.session.sendApplicationDataMessage(message);

    if (response.type === MessageTypes.ObjectPropertiesResponse) {
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
        this.platform.log.info(`${this.buttons.get(buttonId)!.name}: Execute Button`);
      }
  
      const response = await this.session.sendApplicationDataMessage(message);

      this.emit(`button-${buttonId}`);

      if (response.type !== MessageTypes.Acknowledge) {
        throw new Error('Acknowledgement not received');
      }
    } catch(error) {
      this.platform.log.warn(`${this.buttons.get(buttonId)!.name}: Execute Button failed: ${error.message}`);
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
        this.platform.log.info(`${this.zones.get(zoneId)!.name}: Set Bypass ${state ? 'On' : 'Off'} [${this.codes.get(codeId)?.name}]`);
      }
  
      const response = await this.session.sendApplicationDataMessage(message);

      if (response.type !== MessageTypes.Acknowledge) {
        throw new Error('Acknowledgement not received');
      }
    } catch(error) {
      this.platform.log.warn(`${this.zones.get(zoneId)!.name}: Set Bypass failed: ${error.message}`);
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
        this.platform.log.info(`${this.units.get(unitId)!.name}: Set State ${state ? 'On' : 'Off'}`);
      }
  
      const response = await this.session.sendApplicationDataMessage(message);

      if (response.type !== MessageTypes.Acknowledge) {
        throw new Error('Acknowledgement not received');
      }
    } catch(error) {
      this.platform.log.warn(`${this.units.get(unitId)!.name}: Set State failed: ${error.message}`);
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
        this.platform.log.info(`${this.units.get(unitId)!.name}: Set Lighting Level ${brightness}%`);
      }
  
      const response = await this.session.sendApplicationDataMessage(message);

      if (response.type !== MessageTypes.Acknowledge) {
        throw new Error('Acknowledgement not received');
      }
    } catch(error) {
      this.platform.log.warn(`${this.units.get(unitId)!.name}: Set Lighting Level failed: ${error.message}`);
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
        this.platform.log.info(`${this.thermostats.get(thermostatId)!.name}: Set Heat SetPoint ${temperature}`);
      }
  
      const response = await this.session.sendApplicationDataMessage(message);

      if (response.type !== MessageTypes.Acknowledge) {
        throw new Error('Acknowledgement not received');
      }
    } catch(error) {
      this.platform.log.warn(`${this.thermostats.get(thermostatId)!.name}: Set Heat SetPoint failed: ${error.message}`);
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
        this.platform.log.info(`${this.thermostats.get(thermostatId)!.name}: Set Cool SetPoint ${temperature}`);
      }
  
      const response = await this.session.sendApplicationDataMessage(message);

      if (response.type !== MessageTypes.Acknowledge) {
        throw new Error('Acknowledgement not received');
      }
    } catch(error) {
      this.platform.log.warn(`${this.thermostats.get(thermostatId)!.name}: Set Cool SetPoint failed: ${error.message}`);
    }
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

  async setThermostatMode(thermostatId: number, mode: ThermostatModes): Promise<void> {
    this.platform.log.debug(this.constructor.name, 'setThermostatMode', thermostatId, mode);

    try {
      const message = new ControllerCommandRequest({
        command: Commands.SetThermostatMode,
        parameter1: mode,
        parameter2: thermostatId,
      });

      if (this.platform.settings.showOmniEvents) {
        this.platform.log.info(`${this.thermostats.get(thermostatId)!.name}: Set Mode ${ThermostatModes[mode]}`);
      }
  
      const response = await this.session.sendApplicationDataMessage(message);

      if (response.type !== MessageTypes.Acknowledge) {
        throw new Error('Acknowledgement not received');
      }
    } catch(error) {
      this.platform.log.warn(`${this.thermostats.get(thermostatId)!.name}: Set Mode failed: ${error.message}`);
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
        this.platform.log.info(`${this.accessControls.get(accessControlId)!.name}: ${lock ? 'Lock' : 'Unlock'}`);
      }
  
      const response = await this.session.sendApplicationDataMessage(message);

      if (response.type !== MessageTypes.Acknowledge) {
        throw new Error('Acknowledgement not received');
      }
    } catch(error) {
      this.platform.log.warn(
        `${this.accessControls.get(accessControlId)!.name}: ${lock ? 'Lock' : 'Unlock'} failed: ${error.message}`);
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

  async getAreaStatus(areaId: number): Promise<AreaStatus | undefined> {
    this.platform.log.debug(this.constructor.name, 'getAreaStatus', areaId);

    try {
      const message = new ExtendedObjectStatusRequest({
        objectType: ObjectTypes.Area,
        startId: areaId,
        endId: areaId,
      });
  
      const response = await this.session.sendApplicationDataMessage(message);
  
      if (response instanceof ExtendedAreaStatusResponse) {
        return response.areas.get(areaId);
      }
    } catch(error) {
      this.platform.log.error(error);
      throw error;  
    }
  }

  async getZoneStatus(zoneId: number): Promise<ZoneStatus | undefined> {
    this.platform.log.debug(this.constructor.name, 'getZoneStatus', zoneId);

    try {
      const message = new ExtendedObjectStatusRequest({
        objectType: ObjectTypes.Zone,
        startId: zoneId,
        endId: zoneId,
      });
  
      const response = await this.session.sendApplicationDataMessage(message);
  
      if (response instanceof ExtendedZoneStatusResponse) {
        return response.zones.get(zoneId);
      }
    } catch(error) {
      this.platform.log.error(error);
      throw error;  
    }
  }

  async getUnitStatus(unitId: number): Promise<UnitStatus | undefined> {
    this.platform.log.debug(this.constructor.name, 'getUnitStatus', unitId);

    try {
      const message = new ExtendedObjectStatusRequest({
        objectType: ObjectTypes.Unit,
        startId: unitId,
        endId: unitId,
      });
  
      const response = await this.session.sendApplicationDataMessage(message);
  
      if (response instanceof ExtendedUnitStatusResponse) {
        return response.units.get(unitId);
      }
    } catch(error) {
      this.platform.log.error(error);
      throw error;  
    }
  }

  async getThermostatStatus(thermostatId: number): Promise<ThermostatStatus | undefined> {
    this.platform.log.debug(this.constructor.name, 'getThermostatStatus', thermostatId);

    try {
      const message = new ExtendedObjectStatusRequest({
        objectType: ObjectTypes.Thermostat,
        startId: thermostatId,
        endId: thermostatId,
      });
  
      const response = await this.session.sendApplicationDataMessage(message);
  
      if (response instanceof ExtendedThermostatStatusResponse) {
        return response.thermostats.get(thermostatId);
      }
    } catch(error) {
      this.platform.log.error(error);
      throw error;  
    }
  }

  async getLockStatus(lockId: number): Promise<AccessControlLockStatus | undefined> {
    this.platform.log.debug(this.constructor.name, 'getLockStatus', lockId);

    try {
      const message = new ExtendedObjectStatusRequest({
        objectType: ObjectTypes.AccessControlLock,
        startId: lockId,
        endId: lockId,
      });
  
      const response = await this.session.sendApplicationDataMessage(message);
  
      if (response instanceof ExtendedAccessControlLockStatusResponse) {
        return response.locks.get(lockId);
      }
    } catch(error) {
      this.platform.log.error(error);
      throw error;  
    }
  }

  async getAuxiliarySensorStatus(auxiliarySensorId: number): Promise<AuxiliarySensorStatus | undefined> {
    this.platform.log.debug(this.constructor.name, 'getAuxiliarySensorStatus', auxiliarySensorId);

    try {
      const message = new ExtendedObjectStatusRequest({
        objectType: ObjectTypes.AuxiliarySensor,
        startId: auxiliarySensorId,
        endId: auxiliarySensorId,
      });
  
      const response = await this.session.sendApplicationDataMessage(message);
  
      if (response instanceof ExtendedAuxiliarySensorStatusResponse) {
        return response.sensors.get(auxiliarySensorId);
      }
    } catch(error) {
      this.platform.log.error(error);
      throw error;  
    }
  }

  async setAreaAlarmMode(area: number, mode: ArmedModes | ExtendedArmedModes): Promise<void> {
    this.platform.log.debug(this.constructor.name, 'setAlarmState', area, mode);

    try {
      const codeId = await this.getCodeId(area);
      if (codeId === undefined) {
        return;
      }

      const command: Commands = this.getAreaArmCommand(mode);

      this.platform.log.info(`${this.areas.get(area)!.name}: Set Mode ${Commands[command]} [${this.codes.get(codeId)?.name}]`);

      const message = new ControllerCommandRequest({
        command: command,
        parameter1: codeId,
        parameter2: area,
      });
  
      const response = await this.session.sendApplicationDataMessage(message);

      if (response.type !== MessageTypes.Acknowledge) {
        throw new Error('Acknowledgement not received');
      }
    } catch(error) {
      this.platform.log.warn(`${this.areas.get(area)!.name}: Set Mode failed: ${error.message}`);
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
      this.platform.log.warn(`Get Code Id failed: ${error.message}`);
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
      this.platform.log.warn(`Report System Troubles failed: ${error.message}`);
    }
  }

  async setEmergencyAlarm(area: number, emergencyType: EmergencyTypes): Promise<void> {
    this.platform.log.debug(this.constructor.name, 'setEmergencyAlarm', area, emergencyType);

    try {
      this.platform.log.info(`${this.areas.get(area)!.name}: Set Emergency Alarm [${EmergencyTypes[emergencyType]}]`);

      const message = new KeypadEmergencyRequest({
        areaId: area,
        emergencyType: emergencyType,
      });
  
      const response = await this.session.sendApplicationDataMessage(message);

      if (response.type !== MessageTypes.Acknowledge) {
        throw new Error('Acknowledgement not received');
      }
    } catch(error) {
      this.platform.log.warn(`${this.areas.get(area)!.name}: Set Emergency Alarm failed: ${error.message}`);
    }
  }

  // Event Handlers
  areaStatusHandler(areas: Map<number, AreaStatus>): void {
    this.platform.log.debug(this.constructor.name, 'areaStatusHandler', areas);

    try {
      for(const [areaId, areaStatus] of areas.entries()) {
        if (this.platform.settings.showOmniEvents) {
          this.platform.log.info(this.areaStatusMessage(areaId, areaStatus));
        }
        this.emit(`area-${areaId}`, areaStatus);
      }
    } catch(error) {
      this.platform.log.error(error);
    }
  }

  private areaStatusMessage(areaId: number, areaStatus: AreaStatus): string {
    const areaName = this.areas.get(areaId)!.name;
    const mode = SecurityModes[areaStatus.securityMode];
    let triggered = '';

    if (areaStatus.alarmsTriggered.length > 0) {
      const alarms = areaStatus.alarmsTriggered.map((alarm) => Alarms[alarm]);
      triggered = `; Alarm(s) triggered: ${alarms.join()}`;
    }

    return `${areaName}: ${mode}${triggered}`;
  }

  zoneStatusHandler(zones: Map<number, ZoneStatus>): void {
    this.platform.log.debug(this.constructor.name, 'zoneStatusHandler', zones);

    try {
      for(const [zoneId, zoneStatus] of zones.entries()) {
        if (this.platform.settings.showOmniEvents) {
          const name = this.zones.get(zoneId)!.name;
          this.platform.log.info(`${name}: ${ZoneStates[zoneStatus.currentState]}`);
        }
        this.emit(`zone-${zoneId}`, zoneStatus);
      }
    } catch(error) {
      this.platform.log.error(error);
    }
  }

  unitStatusHandler(units: Map<number, UnitStatus>): void {
    this.platform.log.debug(this.constructor.name, 'unitStatusHandler', units);

    try {
      for(const [unitId, unitStatus] of units.entries()) {
        if (this.platform.settings.showOmniEvents) {
          const name = this.units.get(unitId)!.name;
          this.platform.log.info(`${name}: ${UnitStates[unitStatus.state]}`);
        }
        this.emit(`unit-${unitId}`, unitStatus);
      }
    } catch(error) {
      this.platform.log.error(error);
    }
  }

  thermostatStatusHandler(thermostats: Map<number, ThermostatStatus>): void {
    this.platform.log.debug(this.constructor.name, 'thermostatStatusHandler', thermostats);

    try {
      for(const [thermostatId, thermostatStatus] of thermostats.entries()) {
        if (this.platform.settings.showOmniEvents) {
          const name = this.thermostats.get(thermostatId)!.name;
          this.platform.log.info(`${name}: ${thermostatStatus.currentTemperature}; ${ThermostatModes[thermostatStatus.mode]}`);
        }
        this.emit(`thermostat-${thermostatId}`, thermostatStatus);
      }
    } catch(error) {
      this.platform.log.error(error);
    }
  }

  lockStatusHandler(locks: Map<number, AccessControlLockStatus>): void {
    this.platform.log.debug(this.constructor.name, 'lockStatusHandler', locks);

    try {
      for(const [lockId, lockStatus] of locks.entries()) {
        if (this.platform.settings.showOmniEvents) {
          const name = this.accessControls.get(lockId)!.name;
          this.platform.log.info(`${name}: ${lockStatus.locked ? 'Locked' : 'Unlocked'}`);
        }
        this.emit(`lock-${lockId}`, lockStatus);
      }
    } catch(error) {
      this.platform.log.error(error);
    }
  }

  auxiliarySensorStatusHandler(sensors: Map<number, AuxiliarySensorStatus>): void {
    this.platform.log.debug(this.constructor.name, 'auxiliarySensorStatusHandler', sensors);

    try {
      for(const [sensorId, sensorStatus] of sensors.entries()) {
        if (this.platform.settings.showOmniEvents) {
          const name = this.auxiliarySensors.get(sensorId)!.name;
          const message = this.auxiliarySensors.get(sensorId)!.sensorType === SensorTypes.Temperature
            ? `${sensorStatus.temperature} oC`
            : `${sensorStatus.humidity}%`;
          this.platform.log.info(`${name}: ${message}`);
        }
        this.emit(`sensor-${sensorId}`, sensorStatus);
      }
    } catch(error) {
      this.platform.log.error(error);
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
}