import events = require('events');

import { OmniLinkPlatform } from '../platform';
import { OmniSession } from './OmniSession';

import { MessageTypes, ObjectTypes, Commands, AuthorityLevels, EmergencyTypes, ObjectStatusTypes } from './messages/enums';
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
import { SystemFormatsResponse } from './messages/SystemFormatsResponse';
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

import { OmniObjectModel, OmniObjectStatusTypes, SystemTroubles } from '../models/OmniObjectModel';
import { Area, AreaStatus, ArmedModes, ExtendedArmedModes } from '../models/Area';
import { Zone, ZoneStatus } from '../models/Zone';
import { Button } from '../models/Button';
import { Code } from '../models/Code';
import { Unit, UnitStatus } from '../models/Unit';
import { Thermostat, ThermostatStatus, ThermostatModes } from '../models/Thermostat';
import { AuxiliarySensor, AuxiliarySensorStatus } from '../models/AuxiliarySensor';
import { AccessControl, AccessControlLockStatus } from '../models/AccessControl';
import { SystemInformation } from '../models/SystemInformation';
import { SystemFormats, TemperatureFormats } from '../models/SystemFormats';
import { SystemStatus } from '../models/SystemStatus';
import { OmniTemperature } from '../models/OmniTemperature';
import { AudioSourcePropertiesResponse } from './messages/AudioSourcePropertiesResponse';
import { AudioZonePropertiesResponse } from './messages/AudioZonePropertiesResponse';
import { AudioSource } from '../models/AudioSource';
import { AudioZone, AudioZoneStatus } from '../models/AudioZone';
import { ExtendedAudioZoneStatusResponse } from './messages/ExtendedAudioZoneStatusResponse';

export type Devices = {
  areas: number[],
  zones: number[],
  units: number[],
  buttons: number[],
  thermostats: number[],
  codes: number[],
  audioSources: number[],
  audioZones: number[],
  accessControls: number[]
}

export class OmniService extends events.EventEmitter {
  private readonly session: OmniSession;
  private readonly _omni: OmniObjectModel = new OmniObjectModel();

  private pingIntervalId?: NodeJS.Timeout;
  private syncTimeIntervalId?: NodeJS.Timeout;

  constructor(private readonly platform: OmniLinkPlatform) {
    super();
    this.setMaxListeners(150);
    this.session = new OmniSession(platform);
  }

  get omni(): OmniObjectModel {
    return this._omni;
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
          if (error instanceof Error) {
            this.platform.log.warn(`Connection to controller failed: ${error.message}`);
          }
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
      if (error instanceof Error) {
        this.platform.log.error(`Failed to initialise Omni Service: ${error.message}`);
      }
      throw error;
    }
  }

  initialised(): void {
    this.emit('initialised');
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

    await this.setSystemInformation();
    await this.setSystemFormats();

    await this.setAreas(devices?.['areas']);
    await this.setZones(devices?.['zones']);
    await this.setButtons(devices?.['buttons']);
    await this.setCodes(devices?.['codes']);
    await this.setUnits(devices?.['units']);
    await this.setThermostats(devices?.['thermostats']);
    await this.setAuxiliarySensors();
    await this.setAudioSources(devices?.['audioSources']);
    await this.setAudioZones(devices?.['audioZones']);
    await this.setAccessControls(devices?.['accessControls']);

    // Event Handlers
    this.session.on('areas', this.processAreaStatus.bind(this));
    this.session.on('zones', this.processZoneStatus.bind(this));
    this.session.on('units', this.processUnitStatus.bind(this));
    this.session.on('thermostats', this.processThermostatStatus.bind(this));
    this.session.on('locks', this.processAccessControlLockStatus.bind(this));
    this.session.on('sensors', this.processAuxiliarySensorStatus.bind(this));
    this.session.on('audio_zones', this.processAudioZoneStatus.bind(this));
    await this.refreshAllStatuses();
  }

  getEventKey(statusType: OmniObjectStatusTypes, id: number): string {
    return `${OmniObjectStatusTypes[statusType].toLowerCase()}-${id}`;
  }

  private async setAreas(areaIds?: number[]): Promise<void> {
    this.platform.log.debug(this.constructor.name, 'setAreas', areaIds);

    try {
      areaIds = areaIds ?? await this.getObjectIds(ObjectTypes.Area);
      for(const id of areaIds) {
        const properties = await this.getAreaProperties(id);
        if (properties !== undefined && properties.enabled) {
          this.omni.areas[id] = new Area({
            id: id,
            name: properties.name,
            enabled: properties.enabled,
            exitDelay: properties.exitDelay,
            entryDelay: properties.entryDelay,
            mode: properties.mode,
            alarms: properties.alarms,
            entryTimer: properties.exitTimer,
            exitTimer: properties.exitTimer,
          });
        }
      }
    } catch(error) {
      if (error instanceof Error) {
        this.platform.log.error(error.message);
      }
      throw error;      
    }
  }

  private async getAreaProperties(id: number): Promise<AreaPropertiesResponse | undefined> {
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

    return response instanceof AreaPropertiesResponse
      ? response
      : undefined;
  }

  private async setZones(zoneIds?: number[]): Promise<void> {
    this.platform.log.debug(this.constructor.name, 'setZones', zoneIds);

    try {
      zoneIds = zoneIds ?? await this.getObjectIds(ObjectTypes.Zone);
      for(const id of zoneIds) {
        const properties = await this.getZoneProperties(id);
        if (properties !== undefined) {
          this.omni.zones[id] = new Zone({
            id: id,
            name: properties.name,
            type: properties.type,
            areaId: properties.areaId,
            options: properties.options,
            state: properties.state,
            loopReading: properties.loopReading,
          });
        }
      }
    } catch(error) {
      if (error instanceof Error) {
        this.platform.log.error(error.message);
      }
      throw error;      
    }
  }

  private async getZoneProperties(id: number): Promise<ZonePropertiesResponse | undefined> {
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

    return response instanceof ZonePropertiesResponse
      ? response
      : undefined;
  }

  private async setUnits(unitIds?: number[]): Promise<void> {
    this.platform.log.debug(this.constructor.name, 'setUnits', unitIds);

    try {
      unitIds = unitIds ?? await this.getObjectIds(ObjectTypes.Unit);
      for(const id of unitIds) {
        const properties = await this.getUnitProperties(id);
        if (properties !== undefined) {
          this.omni.units[id] = new Unit({
            id: id,
            name: properties.name,
            type: properties.type,
            state: properties.state,
            timeRemaining: properties.timeRemaining,
          });
        }
      }
    } catch(error) {
      if (error instanceof Error) {
        this.platform.log.error(error.message);
      }
      throw error;      
    }
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

    return response instanceof UnitPropertiesResponse
      ? response
      : undefined;
  }

  async setButtons(buttonIds?: number[]): Promise<void> {
    this.platform.log.debug(this.constructor.name, 'setButtons', buttonIds);

    try {
      buttonIds = buttonIds ?? await this.getObjectIds(ObjectTypes.Button);
      for(const id of buttonIds) {
        const properties = await this.getButtonProperties(id);
        if (properties !== undefined) {
          this.omni.buttons[id] = new Button({
            id: id,
            name: properties.name,
          });
        }
      }
    } catch(error) {
      if (error instanceof Error) {
        this.platform.log.error(error.message);
      }
      throw error;      
    }
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

    return response instanceof ButtonPropertiesResponse
      ? response
      : undefined;
  }

  async setCodes(codeIds?: number[]): Promise<void> {
    this.platform.log.debug(this.constructor.name, 'getCodes', codeIds);

    try {
      codeIds = codeIds ?? await this.getObjectIds(ObjectTypes.Code);
      for(const id of codeIds) {
        const properties = await this.getCodeProperties(id);
        if (properties !== undefined) {
          this.omni.codes[id] = new Code({
            id: id,
            name: properties.name,
          });
        }
      }
    } catch(error) {
      if (error instanceof Error) {
        this.platform.log.error(error.message);
      }
      throw error;      
    }
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

    return response instanceof CodePropertiesResponse
      ? response
      : undefined;
  }

  private async setThermostats(thermostatIds?: number[]): Promise<void> {
    this.platform.log.debug(this.constructor.name, 'setThermostats');

    try {
      thermostatIds = thermostatIds ?? await this.getObjectIds(ObjectTypes.Thermostat);
      for(const id of thermostatIds) {
        const properties = await this.getThermostatProperties(id);
        if (properties !== undefined) {
          this.omni.thermostats[id] = new Thermostat({
            id: id,
            name: properties.name,
            type: properties.type,
            communicating: properties.communicating,
            temperature: properties.temperature,
            heatSetPoint: properties.heatSetPoint,
            coolSetPoint: properties.coolSetPoint,
            mode: properties.mode,
            fan: properties.fan,
            hold: properties.hold,
            humidity: properties.humidity,
            humidifySetPoint: properties.humidifySetPoint,
            dehumidifySetPoint: properties.dehumidifySetPoint,
            outdoorTemperature: properties.outdoorTemperature,
            state: properties.state,
          });
        }
      }
    } catch(error) {
      if (error instanceof Error) {
        this.platform.log.error(error.message);
      }
      throw error;      
    }
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

    return response instanceof ThermostatPropertiesResponse
      ? response
      : undefined;
  }

  private async setAudioSources(sourceIds?: number[]): Promise<void> {
    this.platform.log.debug(this.constructor.name, 'setAudioSources', sourceIds);

    try {
      sourceIds = sourceIds ?? await this.getObjectIds(ObjectTypes.AudioSource);
      for(const id of sourceIds) {
        const properties = await this.getAudioSourceProperties(id);
        if (properties !== undefined) {
          this.omni.audioSources[id] = new AudioSource({
            id: id,
            name: properties.name,
          });
        }
      }
    } catch(error) {
      if (error instanceof Error) {
        this.platform.log.error(error.message);
      }
      throw error;      
    }
  }
  
  private async getAudioSourceProperties(id: number): Promise<AudioSourcePropertiesResponse | undefined> {
    this.platform.log.debug(this.constructor.name, 'getAudioSourceProperties', id);

    const message = new ObjectPropertiesRequest({
      objectType: ObjectTypes.AudioSource,
      index: id,
      relativeDirection: 0,
      filter1: 1, // Named audio sources only
      filter2: 0,
      filter3: 0,
    });

    const response = await this.session.sendApplicationDataMessage(message);

    return response instanceof AudioSourcePropertiesResponse
      ? response
      : undefined;
  }

  private async setAudioZones(zoneIds?: number[]): Promise<void> {
    this.platform.log.debug(this.constructor.name, 'setAudioZones', zoneIds);

    try {
      zoneIds = zoneIds ?? await this.getObjectIds(ObjectTypes.AudioZone);
      for(const id of zoneIds) {
        const properties = await this.getAudioZoneProperties(id);
        if (properties !== undefined) {
          this.omni.audioZones[id] = new AudioZone({
            id: id,
            name: properties.name,
            state: properties.state,
            sourceId: properties.sourceId,
            volume: properties.volume,
            mute: properties.mute,
          });
        }
      }
    } catch(error) {
      if (error instanceof Error) {
        this.platform.log.error(error.message);
      }
      throw error;      
    }
  }

  private async getAudioZoneProperties(id: number): Promise<AudioZonePropertiesResponse | undefined> {
    this.platform.log.debug(this.constructor.name, 'getAudioZoneProperties', id);

    const message = new ObjectPropertiesRequest({
      objectType: ObjectTypes.AudioZone,
      index: id,
      relativeDirection: 0,
      filter1: 1, // Named audio zones only
      filter2: 0,
      filter3: 0,
    });

    const response = await this.session.sendApplicationDataMessage(message);

    return response instanceof AudioZonePropertiesResponse
      ? response
      : undefined;
  }

  private async setAccessControls(accessControlIds?: number[]): Promise<void> {
    this.platform.log.debug(this.constructor.name, 'setAccessControls', accessControlIds);

    try {
      accessControlIds = accessControlIds ?? await this.getObjectIds(ObjectTypes.AccessControl);
      for(const id of accessControlIds) {
        const properties = await this.getAccessControlProperties(id);
        if (properties !== undefined) {
          this.omni.accessControls[id] = new AccessControl({
            id: id,
            name: properties.name,
            lockState: properties.lockState,
            unlockTimer: properties.unlockTimer,
            readerState: properties.readerState,
            lastUser: properties.lastUser,
          });
        }
      }
    } catch(error) {
      if (error instanceof Error) {
        this.platform.log.error(error.message);
      }
      throw error;      
    }
  }

  async getAccessControlProperties(id: number): Promise<AccessControlPropertiesResponse | undefined> {
    this.platform.log.debug(this.constructor.name, 'getAccessControlProperties', id);

    const message = new ObjectPropertiesRequest({
      objectType: ObjectTypes.AccessControl,
      index: id,
      relativeDirection: 0,
      filter1: 1, // Named access controls only
      filter2: 0,
      filter3: 0,
    });

    const response = await this.session.sendApplicationDataMessage(message);

    return response instanceof AccessControlPropertiesResponse
      ? response
      : undefined;
  }

  private async setAuxiliarySensors(): Promise<void> {
    this.platform.log.debug(this.constructor.name, 'setAuxiliarySensors');

    try {
      const sensorIds = this.omni.zones.entries().filter(v => v[1].isAuxiliarySensor).map(v => v[0]);
      for(const id of sensorIds) {
        const properties = await this.getAuxiliarySensorProperties(id);
        if (properties !== undefined) {
          this.omni.sensors[id] = new AuxiliarySensor({
            id: id,
            name: properties.name,
            type: properties.type,
            state: properties.state,
            temperature: properties.temperature,
            lowSetPoint: properties.lowSetPoint,
            highSetPoint: properties.highSetPoint,
          });
        }
      }
    } catch(error) {
      if (error instanceof Error) {
        this.platform.log.error(error.message);
      }
      throw error;      
    }
  }


  async getAuxiliarySensorProperties(id: number): Promise<AuxiliarySensorPropertiesResponse | undefined> {
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

    return response instanceof AuxiliarySensorPropertiesResponse
      ? response
      : undefined;
  }

  async setTime(): Promise<void> {
    this.platform.log.debug(this.constructor.name, 'setTime');

    try {
      const response = await this.getSystemStatus();
      if (response === undefined) {
        return;
      }

      this.omni.status = new SystemStatus({
        timeDateValid: response.timeDateValid,
        year: response.year,
        month: response.month,
        day: response.day,
        dayOfWeek: response.dayOfWeek,
        hour: response.hour,
        minute: response.minute,
        second: response.second,
        daylightSavingsTime: response.daylightSavingsTime,
        sunriseHour: response.sunriseHour,
        sunriseMinute: response.sunriseMinute,
        sunsetHour: response.sunsetHour,
        sunsetMinute: response.sunsetMinute,
        batteryReading: response.batteryReading,
      });

      let now = new Date();

      if (Math.abs(this.omni.status.dateTime.getTime() - now.getTime()) <= 60000 &&
      this.omni.status.daylightSavingsTime === this.isDaylightSavings(now) ) {
        return;
      }

      this.platform.log.info(`Sync Time: Omni Controller ${this.omni.status.dateTime.toLocaleString()}, Host ${now.toLocaleString()}`);

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
  
      const setTimeResponse = await this.session.sendApplicationDataMessage(message);

      if (setTimeResponse.messageType !== MessageTypes.Acknowledge) {
        throw new Error('Acknowledgement not received');
      }
    } catch(error) {
      if (error instanceof Error) {
        this.platform.log.warn(`Set Time: Failed [${error.message}]`);
      }
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
        this.platform.log.info(`${this.omni.buttons[buttonId]}: Execute Button`);
      }
  
      const response = await this.session.sendApplicationDataMessage(message);

      this.emit(this.getEventKey(OmniObjectStatusTypes.Button, buttonId));

      if (response.messageType !== MessageTypes.Acknowledge) {
        throw new Error('Acknowledgement not received');
      }
    } catch(error) {
      if (error instanceof Error) {
        this.platform.log.warn(`${this.omni.buttons[buttonId]}: Execute Button failed [${error.message}]`);
      }
    }
  }

  async setZoneBypass(zoneId: number, state: boolean): Promise<void> {
    this.platform.log.debug(this.constructor.name, 'setZoneBypass', zoneId, state);

    const zone = this.omni.zones[zoneId];
    try {
      const codeId = await this.getCodeId(zone.areaId);
      if (codeId === undefined) {
        return;
      }

      const message = new ControllerCommandRequest({
        command: state ? Commands.BypassZone : Commands.RestoreZone,
        parameter1: codeId,
        parameter2: zoneId,
      });

      if (this.platform.settings.showOmniEvents) {
        this.platform.log.info(`${zone}: Set Bypass ${state ? 'On' : 'Off'} [${this.omni.codes[codeId].name}]`);
      }
  
      const response = await this.session.sendApplicationDataMessage(message);

      if (response.messageType !== MessageTypes.Acknowledge) {
        throw new Error('Acknowledgement not received');
      }
    } catch(error) {
      if (error instanceof Error) {
        this.platform.log.warn(`${zone}: Set Bypass failed [${error.message}]`);
      }
    }
  }

  async setUnitState(unitId: number, state: boolean): Promise<void> {
    this.platform.log.debug(this.constructor.name, 'setUnitState', unitId, state);

    const unit = this.omni.units[unitId];
    try {
      const message = new ControllerCommandRequest({
        command: state ? Commands.UnitOn : Commands.UnitOff,
        parameter1: 0,
        parameter2: unitId,
      });

      if (this.platform.settings.showOmniEvents) {
        this.platform.log.info(`${unit}: Set State ${state ? 'On' : 'Off'}`);
      }
  
      const response = await this.session.sendApplicationDataMessage(message);

      if (response.messageType !== MessageTypes.Acknowledge) {
        throw new Error('Acknowledgement not received');
      }
    } catch(error) {
      if (error instanceof Error) {
        this.platform.log.warn(`${unit}: Set State failed [${error.message}]`);
      }
    }
  }

  async setUnitBrightness(unitId: number, brightness: number): Promise<void> {
    this.platform.log.debug(this.constructor.name, 'setUnitBrightness', unitId, brightness);

    const unit = this.omni.units[unitId];
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
        this.platform.log.info(`${unit}: Set Lighting Level ${brightness}%`);
      }
  
      const response = await this.session.sendApplicationDataMessage(message);

      if (response.messageType !== MessageTypes.Acknowledge) {
        throw new Error('Acknowledgement not received');
      }
    } catch(error) {
      if (error instanceof Error) {
        this.platform.log.warn(`${unit}: Set Lighting Level failed [${error.message}]`);
      }
    }
  }
  
  async setThermostatHeatSetPoint(thermostatId: number, temperature: number): Promise<void> { // temperature is in Celcius
    this.platform.log.debug(this.constructor.name, 'setThermostatHeatSetPoint', thermostatId, temperature);

    const thermostat = this.omni.thermostats[thermostatId];
    const omniTemperature = new OmniTemperature(OmniTemperature.fromCelcius(temperature), this.omni.formats.temperature);
    try {
      const message = new ControllerCommandRequest({
        command: Commands.SetHeatSetPoint,
        parameter1: omniTemperature.value,
        parameter2: thermostatId,
      });

      if (this.platform.settings.showOmniEvents) {
        this.platform.log.info(`${thermostat}: Set Heat SetPoint ${omniTemperature}`);
      }
  
      const response = await this.session.sendApplicationDataMessage(message);

      if (response.messageType !== MessageTypes.Acknowledge) {
        throw new Error('Acknowledgement not received');
      }
    } catch(error) {
      if (error instanceof Error) {
        this.platform.log.warn(`${thermostat}: Set Heat SetPoint failed [${error.message}]`);
      }
    }
  }

  async setThermostatCoolSetPoint(thermostatId: number, temperature: number): Promise<void> { // temperature is in Celcius
    this.platform.log.debug(this.constructor.name, 'setThermostatCoolSetPoint', thermostatId, temperature);

    const thermostat = this.omni.thermostats[thermostatId];
    const omniTemperature = new OmniTemperature(OmniTemperature.fromCelcius(temperature), this.omni.formats.temperature);
    try {
      const message = new ControllerCommandRequest({
        command: Commands.SetCoolSetPoint,
        parameter1: omniTemperature.value,
        parameter2: thermostatId,
      });

      if (this.platform.settings.showOmniEvents) {
        this.platform.log.info(`${thermostat}: Set Cool SetPoint ${omniTemperature}`);
      }
  
      const response = await this.session.sendApplicationDataMessage(message);

      if (response.messageType !== MessageTypes.Acknowledge) {
        throw new Error('Acknowledgement not received');
      }
    } catch(error) {
      if (error instanceof Error) {
        this.platform.log.warn(`${thermostat}: Set Cool SetPoint failed [${error.message}]`);
      }
    }
  }

  async setThermostatMode(thermostatId: number, mode: ThermostatModes): Promise<void> {
    this.platform.log.debug(this.constructor.name, 'setThermostatMode', thermostatId, mode);

    const thermostat = this.omni.thermostats[thermostatId];
    try {
      const message = new ControllerCommandRequest({
        command: Commands.SetThermostatMode,
        parameter1: mode,
        parameter2: thermostatId,
      });

      if (this.platform.settings.showOmniEvents) {
        this.platform.log.info(`${thermostat}: Set Mode ${ThermostatModes[mode]}`);
      }
  
      const response = await this.session.sendApplicationDataMessage(message);

      if (response.messageType !== MessageTypes.Acknowledge) {
        throw new Error('Acknowledgement not received');
      }
    } catch(error) {
      if (error instanceof Error) {
        this.platform.log.warn(`${thermostat}: Set Mode failed [${error.message}]`);
      }
    }
  }

  async setThermostatHumidifySetPoint(thermostatId: number, humidity: number): Promise<void> {
    this.platform.log.debug(this.constructor.name, 'setThermostatHumidifySetPoint', thermostatId, humidity);

    const thermostat = this.omni.thermostats[thermostatId];
    const omniTemperature = new OmniTemperature(OmniTemperature.fromPercentage(humidity), TemperatureFormats.Percentage);
    try {
      const message = new ControllerCommandRequest({
        command: Commands.SetHumidifySetPoint,
        parameter1: omniTemperature.value,
        parameter2: thermostatId,
      });

      if (this.platform.settings.showOmniEvents) {
        this.platform.log.info(`${thermostat}: Set Humidify SetPoint ${omniTemperature}`);
      }
  
      const response = await this.session.sendApplicationDataMessage(message);

      if (response.messageType !== MessageTypes.Acknowledge) {
        throw new Error('Acknowledgement not received');
      }
    } catch(error) {
      if (error instanceof Error) {
        this.platform.log.warn(`${thermostat}: Set Humidify SetPoint failed [${error.message}]`);
      }
    }
  }

  async setThermostatDehumidifySetPoint(thermostatId: number, humidity: number): Promise<void> {
    this.platform.log.debug(this.constructor.name, 'setThermostatDehumidifySetPoint', thermostatId, humidity);

    const thermostat = this.omni.thermostats[thermostatId];
    const omniTemperature = new OmniTemperature(OmniTemperature.fromPercentage(humidity), TemperatureFormats.Percentage);
    try {
      const message = new ControllerCommandRequest({
        command: Commands.SetDehumidifySetPoint,
        parameter1: omniTemperature.value,
        parameter2: thermostatId,
      });

      if (this.platform.settings.showOmniEvents) {
        this.platform.log.info(`${thermostat}: Set Dehumidify SetPoint ${omniTemperature}`);
      }
  
      const response = await this.session.sendApplicationDataMessage(message);

      if (response.messageType !== MessageTypes.Acknowledge) {
        throw new Error('Acknowledgement not received');
      }
    } catch(error) {
      if (error instanceof Error) {
        this.platform.log.warn(`${thermostat}: Set Dehumidify SetPoint failed [${error.message}]`);
      }
    }
  }

  async setLockState(accessControlId: number, lock: boolean): Promise<void> {
    this.platform.log.debug(this.constructor.name, 'lockDoor', accessControlId, lock);

    const accessControl = this.omni.accessControls[accessControlId];
    try {
      const message = new ControllerCommandRequest({
        command: lock ? Commands.LockDoor : Commands.UnlockDoor,
        parameter1: 0,
        parameter2: accessControlId,
      });

      if (this.platform.settings.showOmniEvents) {
        this.platform.log.info(`${accessControl}: ${lock ? 'Lock' : 'Unlock'}`);
      }
  
      const response = await this.session.sendApplicationDataMessage(message);

      if (response.messageType !== MessageTypes.Acknowledge) {
        throw new Error('Acknowledgement not received');
      }
    } catch(error) {
      if (error instanceof Error) {
        this.platform.log.warn(`${accessControl}: ${lock ? 'Lock' : 'Unlock'} failed [${error.message}]`);
      }
    }
  }

  async notify(): Promise<void> {
    this.platform.log.debug(this.constructor.name, 'notify');

    try {
      const message = new EnableNotificationsRequest(true);
      const response = await this.session.sendApplicationDataMessage(message);

      if (response.messageType !== MessageTypes.Acknowledge) {
        throw new Error('Acknowledgement not received');
      }
    } catch(error) {
      if (error instanceof Error) {
        this.platform.log.error(error.message);
      }
      throw error;      
    }
  }

  // System
  async setSystemInformation(): Promise<void> {
    this.platform.log.debug(this.constructor.name, 'setSystemInformation');

    try {
      const message = new SystemInformationRequest();
      const response = await this.session.sendApplicationDataMessage(message);

      if (response instanceof SystemInformationResponse) {
        this.omni.information = new SystemInformation({
          modelNumber: response.modelNumber,
          majorVersion: response.majorVersion,
          minorVersion: response.minorVersion,
          revision: response.revision,
          localPhoneNumber: response.localPhoneNumber,
        });
      }
    } catch(error) {
      if (error instanceof Error) {
        this.platform.log.error(error.message);
      }
      throw error;      
    }
  }

  async getSystemStatus(): Promise<SystemStatusResponse | undefined> {
    this.platform.log.debug(this.constructor.name, 'getSystemStatus');

    try {
      const message = new SystemStatusRequest();
      const response = await this.session.sendApplicationDataMessage(message);
      return response as SystemStatusResponse;
    } catch(error) {
      if (error instanceof Error) {
        this.platform.log.error(error.message);
      }
      throw error;      
    }
  }

  async getSystemTroubles(): Promise<SystemTroublesResponse | undefined> {
    this.platform.log.debug(this.constructor.name, 'getSystemTroubles');

    try {
      const message = new SystemTroublesRequest();
      const response = await this.session.sendApplicationDataMessage(message);
      return response as SystemTroublesResponse;
    } catch(error) {
      if (error instanceof Error) {
        this.platform.log.error(error.message);
      }
      throw error;      
    }
  }

  async setSystemFormats(): Promise<void> {
    this.platform.log.debug(this.constructor.name, 'setSystemFormats');

    try {
      const message = new SystemFormatsRequest();
      const response = await this.session.sendApplicationDataMessage(message);

      if (response instanceof SystemFormatsResponse) {
        this.omni.formats = new SystemFormats({
          temperature: response.temperature,
          time: response.time,
          date: response.date,
        });
      }
    } catch(error) {
      if (error instanceof Error) {
        this.platform.log.error(error.message);
      }
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
    if (this.omni.areas.length > 0) {
      startId = Math.min(...this.omni.areas.keys());
      endId = Math.max(...this.omni.areas.keys());
      response = await this.getObjectStatus(ObjectStatusTypes.Area, startId, endId);
      if (response instanceof ExtendedAreaStatusResponse) {
        this.processAreaStatus(response);
      }
    }

    // Zones
    if (this.omni.zones.length > 0) {
      startId = Math.min(...this.omni.zones.keys());
      endId = Math.max(...this.omni.zones.keys());
      response = await this.getObjectStatus(ObjectStatusTypes.Zone, startId, endId);
      if (response instanceof ExtendedZoneStatusResponse) {
        this.processZoneStatus(response);
      }
    }

    // Units
    if (this.omni.units.length > 0) {
      startId = Math.min(...this.omni.units.keys());
      endId = Math.max(...this.omni.units.keys());
      response = await this.getObjectStatus(ObjectStatusTypes.Unit, startId, endId);
      if (response instanceof ExtendedUnitStatusResponse) {
        this.processUnitStatus(response);
      }
    }

    // Thermostats
    if (this.omni.thermostats.length > 0) {
      startId = Math.min(...this.omni.thermostats.keys());
      endId = Math.max(...this.omni.thermostats.keys());
      response = await this.getObjectStatus(ObjectStatusTypes.Thermostat, startId, endId);
      if (response instanceof ExtendedThermostatStatusResponse) {
        this.processThermostatStatus(response);
      }
    }

    // Access Controls
    if (this.omni.accessControls.length > 0) {
      startId = Math.min(...this.omni.accessControls.keys());
      endId = Math.max(...this.omni.accessControls.keys());
      response = await this.getObjectStatus(ObjectStatusTypes.AccessControlLock, startId, endId);
      if (response instanceof ExtendedAccessControlLockStatusResponse) {
        this.processAccessControlLockStatus(response);
      }
    }

    // Auxiliary Sensors
    if (this.omni.sensors.length > 0) {
      startId = Math.min(...this.omni.sensors.keys());
      endId = Math.max(...this.omni.sensors.keys());
      response = await this.getObjectStatus(ObjectStatusTypes.AuxiliarySensor, startId, endId);
      if (response instanceof ExtendedAuxiliarySensorStatusResponse) {
        this.processAuxiliarySensorStatus(response);
      }
    }

    // Audio Zones - TODO
    if (this.omni.audioZones.length > 0) {
      startId = Math.min(...this.omni.audioZones.keys());
      endId = Math.max(...this.omni.audioZones.keys());
      response = await this.getObjectStatus(ObjectStatusTypes.AudioZone, startId, endId);
      if (response instanceof ExtendedAudioZoneStatusResponse) {
        this.processAudioZoneStatus(response);
      }
    }
  }

  private async getObjectStatus(
    statusType: ObjectStatusTypes, startId: number, endId: number): Promise<ApplicationDataResponse | undefined> {
    this.platform.log.debug(this.constructor.name, 'getObjectStatus', statusType, startId, endId);

    try {
      const message = new ExtendedObjectStatusRequest({
        statusType: statusType,
        startId: startId,
        endId: endId,
      });
  
      return await this.session.sendApplicationDataMessage(message);
    } catch(error) {
      if (error instanceof Error) {
        this.platform.log.error(error.message);
      }
    }
  }

  private processAreaStatus(response: ExtendedAreaStatusResponse) {
    this.platform.log.debug(this.constructor.name, 'processAreaStatus', response);

    try {
      for(const index in response.id) {
        const id = response.id[index];
        if (!this.omni.areas.hasKey(id)) {
          continue;
        }
        const area = this.omni.areas[id];
        const status = new AreaStatus({
          mode: response.mode[index],
          alarms: response.alarms[index],
          entryTimer: response.entryTimer[index],
          exitTimer: response.exitTimer[index],
        });
        if (status.equals(area.status)) {
          continue;
        }
        if (this.platform.settings.showOmniEvents) {
          this.platform.log.info(`${area}: ${status}`);
        }
        area.status = status;
        this.emit(this.getEventKey(OmniObjectStatusTypes.Area, id), status);
      }
    } catch(error) {
      if (error instanceof Error) {
        this.platform.log.error(error.message);
      }
    }
  }

  private processZoneStatus(response: ExtendedZoneStatusResponse) {
    this.platform.log.debug(this.constructor.name, 'processZoneStatus', response);

    try {
      for(const index in response.id) {
        const id = response.id[index];
        if (!this.omni.zones.hasKey(id)) {
          continue;
        }
        const zone = this.omni.zones[id];
        const status = new ZoneStatus({
          state: response.state[index],
          loopReading: response.loopReading[index],
        });
        if (status.equals(zone.status)) {
          continue;
        }
        if (this.platform.settings.showOmniEvents) {
          this.platform.log.info(`${zone}: ${status}`);
        }
        zone.status = status;
        this.emit(this.getEventKey(OmniObjectStatusTypes.Zone, id), status);
      }
    } catch(error) {
      if (error instanceof Error) {
        this.platform.log.error(error.message);
      }
    }
  }

  private processUnitStatus(response: ExtendedUnitStatusResponse) {
    this.platform.log.debug(this.constructor.name, 'processUnitStatus', response);

    try {
      for(const index in response.id) {
        const id = response.id[index];
        if (!this.omni.units.hasKey(id)) {
          continue;
        }
        const unit = this.omni.units[id];
        const status = new UnitStatus({
          state: response.state[index],
          timeRemaining: response.timeRemaining[index],
        });
        if (status.equals(unit.status)) {
          continue;
        }
        if (this.platform.settings.showOmniEvents) {
          this.platform.log.info(`${unit}: ${status}`);
        }
        unit.status = status;
        this.emit(this.getEventKey(OmniObjectStatusTypes.Unit, id), status);
      }
    } catch(error) {
      if (error instanceof Error) {
        this.platform.log.error(error.message);
      }
    }
  }

  private processThermostatStatus(response: ExtendedThermostatStatusResponse) {
    this.platform.log.debug(this.constructor.name, 'processThermostatStatus', response);

    try {
      for(const index in response.id) {
        const id = response.id[index];
        if (!this.omni.thermostats.hasKey(id)) {
          continue;
        }
        const thermostat = this.omni.thermostats[id];
        const status = new ThermostatStatus({
          communicating: response.communicating[index],
          temperature: response.temperature[index],
          heatSetPoint: response.heatSetPoint[index],
          coolSetPoint: response.coolSetPoint[index],
          mode: response.mode[index],
          fan: response.fan[index],
          hold: response.hold[index],
          humidity: response.humidity[index],
          humidifySetPoint: response.humidifySetPoint[index],
          dehumidifySetPoint: response.dehumidifySetPoint[index],
          outdoorTemperature: response.outdoorTemperature[index],
          state: response.state[index],
        });
        if (status.equals(thermostat.status)) {
          continue;
        }
        if (this.platform.settings.showOmniEvents) {
          this.platform.log.info(`${thermostat}: ${status}`);
        }
        thermostat.status = status;
        this.emit(this.getEventKey(OmniObjectStatusTypes.Thermostat, id), status);
      }
    } catch(error) {
      if (error instanceof Error) {
        this.platform.log.error(error.message);
      }
    }
  }

  private processAuxiliarySensorStatus(response: ExtendedAuxiliarySensorStatusResponse) {
    this.platform.log.debug(this.constructor.name, 'processAuxiliarySensorStatus', response);

    try {
      for(const index in response.id) {
        const id = response.id[index];
        if (!this.omni.sensors.hasKey(id)) {
          continue;
        }
        const sensor = this.omni.sensors[id];
        const status = new AuxiliarySensorStatus({
          state: response.state[index],
          temperature: response.temperature[index],
          lowSetPoint: response.lowSetPoint[index],
          highSetPoint: response.highSetPoint[index],
        });
        if (status.equals(sensor.status)) {
          continue;
        }
        if (this.platform.settings.showOmniEvents) {
          this.platform.log.info(`${sensor}: ${status}`);
        }
        sensor.status = status;
        this.emit(this.getEventKey(OmniObjectStatusTypes.AuxiliarySensor, id), status);
      }
    } catch(error) {
      if (error instanceof Error) {
        this.platform.log.error(error.message);
      }
    }
  }

  private processAudioZoneStatus(response: ExtendedAudioZoneStatusResponse) {
    this.platform.log.debug(this.constructor.name, 'processAudioZoneStatus', response);

    try {
      for(const index in response.id) {
        const id = response.id[index];
        if (!this.omni.audioZones.hasKey(id)) {
          continue;
        }
        const audioZone = this.omni.audioZones[id];
        const status = new AudioZoneStatus({
          state: response.state[index],
          sourceId: response.sourceId[index],
          volume: response.volume[index],
          mute: response.mute[index],
        });
        if (status.equals(audioZone.status)) {
          continue;
        }
        if (this.platform.settings.showOmniEvents) {
          this.platform.log.info(`${audioZone}: ${status}`);
        }
        audioZone.status = status;
        this.emit(this.getEventKey(OmniObjectStatusTypes.AudioZone, id), status);
      }
    } catch(error) {
      if (error instanceof Error) {
        this.platform.log.error(error.message);
      }
    }
  }

  private processAccessControlLockStatus(response: ExtendedAccessControlLockStatusResponse) {
    this.platform.log.debug(this.constructor.name, 'processAccessControlLockStatus', response);

    try {
      for(const index in response.id) {
        const id = response.id[index];
        if (!this.omni.accessControls.hasKey(id)) {
          continue;
        }
        const accessControl = this.omni.accessControls[id];
        const status = new AccessControlLockStatus({
          lockState: response.lockState[index],
          unlockTimer: response.unlockTimer[index],
        });
        if (status.equals(accessControl.lockStatus)) {
          continue;
        }
        if (this.platform.settings.showOmniEvents) {
          this.platform.log.info(`${accessControl}: ${status}`);
        }
        accessControl.lockStatus = status;
        this.emit(this.getEventKey(OmniObjectStatusTypes.AccessControlLock, id), status);
      }
    } catch(error) {
      if (error instanceof Error) {
        this.platform.log.error(error.message);
      }
    }
  }

  async setAreaAlarmMode(areaId: number, mode: ArmedModes | ExtendedArmedModes): Promise<void> {
    this.platform.log.debug(this.constructor.name, 'setAlarmState', areaId, mode);

    const area = this.omni.areas[areaId];
    try {
      const codeId = await this.getCodeId(areaId);
      if (codeId === undefined) {
        return;
      }

      const command: Commands = this.getAreaArmCommand(mode);

      if (this.platform.settings.showOmniEvents) {
        this.platform.log.info(`${area}: Set Mode ${Commands[command]} [${this.omni.codes[codeId].name}]`);
      }

      const message = new ControllerCommandRequest({
        command: command,
        parameter1: codeId,
        parameter2: areaId,
      });
  
      const response = await this.session.sendApplicationDataMessage(message);

      if (response.messageType !== MessageTypes.Acknowledge) {
        throw new Error('Acknowledgement not received');
      }
    } catch(error) {
      if (error instanceof Error) {
        this.platform.log.warn(`${area}: Set Mode failed [${error.message}]`);
      }
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
      if (error instanceof Error) {
        this.platform.log.warn(`Get Code Id failed [${error.message}]`);
      }
    }
  }

  private async reportSystemTroubles(): Promise<void> {
    this.platform.log.debug(this.constructor.name, 'reportSystemTroubles');

    try {
      const response = await this.getSystemTroubles();
      if (!(response instanceof SystemTroublesResponse)) {
        return;
      }

      const lastTroubles = [...this.omni.troubles];
      this.omni.troubles.length = 0; // clear array
      for (const trouble of response.troubles) {
        switch(trouble) {
          case 1:
          case 7:
            this.omni.troubles.push(SystemTroubles.Freeze);
            break;
          case 2:
          case 8:
            this.omni.troubles.push(SystemTroubles.BatteryLow);
            break;
          case 3:
            this.omni.troubles.push(SystemTroubles.ACPower);
            break;
          case 4:
            this.omni.troubles.push(SystemTroubles.PhoneLine);
            break;
          case 5:
            this.omni.troubles.push(SystemTroubles.DigitalCommunicator);
            break;
          case 6:
            this.omni.troubles.push(SystemTroubles.Fuse);
            break;
        }
      }

      this.emit('system-troubles', this.omni.troubles);
      for(const trouble of this.omni.troubles) {
        if (!lastTroubles.includes(trouble)) {
          this.platform.log.warn(`Trouble: ${SystemTroubles[trouble]}`);
          this.emit('system-trouble', trouble);
        }
      }
    } catch(error) {
      if (error instanceof Error) {
        this.platform.log.warn(`Report System Troubles failed [${error.message}]`);
      }
    }
  }

  async setEmergencyAlarm(areaId: number, emergencyType: EmergencyTypes): Promise<void> {
    this.platform.log.debug(this.constructor.name, 'setEmergencyAlarm', areaId, emergencyType);

    const area = this.omni.areas[areaId];
    try {
      if (this.platform.settings.showOmniEvents) {
        this.platform.log.info(`${area}: Set Emergency Alarm [${EmergencyTypes[emergencyType]}]`);
      }

      const message = new KeypadEmergencyRequest({
        areaId: areaId,
        emergencyType: emergencyType,
      });
  
      const response = await this.session.sendApplicationDataMessage(message);

      if (response.messageType !== MessageTypes.Acknowledge) {
        throw new Error('Acknowledgement not received');
      }
    } catch(error) {
      if (error instanceof Error) {
        this.platform.log.warn(`${area}: Set Emergency Alarm failed [${error.message}]`);
      }
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