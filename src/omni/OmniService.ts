import events = require('events');

import { OmniLinkPlatform } from '../platform';
import { OmniSession } from './OmniSession';

import { MessageTypes, ObjectTypes, Commands, SecurityModes, Alarms, AuthorityLevels } from './messages/enums';
import { ObjectTypeCapacitiesRequest } from './messages/ObjectTypeCapacitiesRequest';
import { ObjectTypeCapacitiesResponse } from './messages/ObjectTypeCapacitiesResponse';
import { ObjectPropertiesRequest } from './messages/ObjectPropertiesRequest';
import { ZonePropertiesResponse } from './messages/ZonePropertiesResponse';
import { AreaPropertiesResponse } from './messages/AreaPropertiesResponse';
import { ButtonPropertiesResponse } from './messages/ButtonPropertiesResponse';
import { CodePropertiesResponse } from './messages/CodePropertiesResponse';
import { SetTimeCommandRequest } from './messages/SetTimeCommandRequest';
import { ControllerCommandRequest } from './messages/ControllerCommandRequest';
import { EnableNotificationsRequest } from './messages/EnableNotificationsRequest';
import { SystemInformationRequest } from './messages/SystemInformationRequest';
import { SystemInformationResponse } from './messages/SystemInformationResponse';
import { ExtendedObjectStatusRequest } from './messages/ExtendedObjectStatusRequest';
import { ExtendedAreaStatusResponse, ExtendedAreaStatus } from './messages/ExtendedAreaStatusResponse';
import { ExtendedZoneStatusResponse, ExtendedZoneStatus, ZoneCurrentStates } from './messages/ExtendedZoneStatusResponse';
import { SecurityCodeValidationRequest } from './messages/SecurityCodeValidationRequest';
import { SecurityCodeValidationResponse } from './messages/SecurityCodeValidationResponse';

export { ZoneTypes } from './messages/ZonePropertiesResponse';

export enum AlarmModes {
  Disarmed = 0,
  ArmedDay = 1,
  ArmedNight = 2,
  ArmedAway = 3
}

export type AreaStatus = {
  burglaryTriggered: boolean,
  fireTriggered: boolean,
  gasTriggered: boolean,
  auxiliaryTriggered: boolean,
  freezeTriggered: boolean,
  waterTriggered: boolean,
  duressTriggered: boolean,
  temperatureTriggered: boolean,
  alarmMode: AlarmModes
}

export type ZoneStatus = {
  ready: boolean,
  trouble: boolean,
}

export class OmniService extends events.EventEmitter {
  private readonly session: OmniSession;
  private pingIntervalId?: NodeJS.Timeout;
  private syncTimeIntervalId?: NodeJS.Timeout;
  private _model?: string;
  private _version?: string;
  private _zones: Map<number, ZonePropertiesResponse>;
  private _areas: Map<number, AreaPropertiesResponse>;
  private _buttons: Map<number, ButtonPropertiesResponse>;
  private _codes: Map<number, CodePropertiesResponse>;

  constructor(private readonly platform: OmniLinkPlatform) {
    super();
    this.session = new OmniSession(platform);
    this._zones = new Map<number, ZonePropertiesResponse>();
    this._areas = new Map<number, AreaPropertiesResponse>();
    this._buttons = new Map<number, ButtonPropertiesResponse>();
    this._codes = new Map<number, CodePropertiesResponse>();

    this.session.on('areas', this.areaStatusHandler.bind(this));
    this.session.on('zones', this.zoneStatusHandler.bind(this));
  }

  get model(): string {
    return this._model ?? '';
  }

  get version(): string {
    return this._version ?? '';
  }

  get zones(): Map<number, ZonePropertiesResponse> {
    return this._zones;
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

      // Ping controller so it doesn't close connection
      this.pingIntervalId = setInterval(() => {
        this.getSystemInformation();
      }, 60000); // every minute

      // Sync time
      if (this.platform.settings.syncTime) {
        await this.setTime();
        this.syncTimeIntervalId = setInterval(async () => {
          await this.setTime();
        }, 86400000); // every 24 hours
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

  async discover(): Promise<void> {
    this.platform.log.debug(this.constructor.name, 'discover');

    const systemInformation = await this.getSystemInformation();
    if (systemInformation) {
      this._model = systemInformation.model;
      this._version = systemInformation.version;
    }

    this._zones = await this.getZones();
    this._areas = await this.getAreas();
    this._buttons = await this.getButtons();
    this._codes = await this.getCodes();
  }

  async getAreas(): Promise<Map<number, AreaPropertiesResponse>> {
    this.platform.log.debug(this.constructor.name, 'getAreas');

    const areas = new Map<number, AreaPropertiesResponse>();
    try {
      // Get Area capacity
      const message = new ObjectTypeCapacitiesRequest({
        objectType: ObjectTypes.Area,
      });
      const response = await this.session.sendApplicationDataMessage(message);

      const areaLimit = (<ObjectTypeCapacitiesResponse>response).capcity;

      // Get Area names
      for(let i = 1; i <= areaLimit; i++) {
        const properties = await this.getAreaProperties(i);
        if (properties !== undefined && properties.enabled) {
          areas.set(i, properties);
        }
      }
    } catch(error) {
      this.platform.log.error(error);
      throw error;      
    }

    return areas;
  }

  async getAreaProperties(index: number): Promise<AreaPropertiesResponse | undefined> {
    this.platform.log.debug(this.constructor.name, 'getAreaProperties', index);

    const message = new ObjectPropertiesRequest({
      objectType: ObjectTypes.Area,
      index: index,
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

  async getZones(): Promise<Map<number, ZonePropertiesResponse>> {
    this.platform.log.debug(this.constructor.name, 'getZones');

    const zones = new Map<number, ZonePropertiesResponse>();
    try {
      // Get Zone capacity
      const message = new ObjectTypeCapacitiesRequest({
        objectType: ObjectTypes.Zone,
      });
      const response = await this.session.sendApplicationDataMessage(message);

      const zoneLimit = (<ObjectTypeCapacitiesResponse>response).capcity;

      // Get Zone names
      for(let i = 1; i <= zoneLimit; i++) {
        const properties = await this.getZoneProperties(i);
        if (properties !== undefined) {
          zones.set(i, properties);
        }
      }
    } catch(error) {
      this.platform.log.error(error);
      throw error;      
    }

    return zones;
  }

  async getZoneProperties(index: number): Promise<ZonePropertiesResponse | undefined> {
    this.platform.log.debug(this.constructor.name, 'getZoneProperties', index);

    const message = new ObjectPropertiesRequest({
      objectType: ObjectTypes.Zone,
      index: index,
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

  async getButtons(): Promise<Map<number, ButtonPropertiesResponse>> {
    this.platform.log.debug(this.constructor.name, 'getButtons');

    const buttons = new Map<number, ButtonPropertiesResponse>();
    try {
      // Get Button capacity
      const message = new ObjectTypeCapacitiesRequest({
        objectType: ObjectTypes.Button,
      });
      const response = await this.session.sendApplicationDataMessage(message);

      const buttonLimit = (<ObjectTypeCapacitiesResponse>response).capcity;

      // Get Button names
      for(let i = 1; i <= buttonLimit; i++) {
        const properties = await this.getButtonProperties(i);
        if (properties !== undefined) {
          buttons.set(i, properties);
        }
      }
    } catch(error) {
      this.platform.log.error(error);
      throw error;      
    }

    return buttons;
  }

  async getButtonProperties(index: number): Promise<ButtonPropertiesResponse | undefined> {
    this.platform.log.debug(this.constructor.name, 'getButtonProperties', index);

    const message = new ObjectPropertiesRequest({
      objectType: ObjectTypes.Button,
      index: index,
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

  async getCodes(): Promise<Map<number, CodePropertiesResponse>> {
    this.platform.log.debug(this.constructor.name, 'getCodes');

    const codes = new Map<number, CodePropertiesResponse>();
    try {
      // Get Codes capacity
      const message = new ObjectTypeCapacitiesRequest({
        objectType: ObjectTypes.Code,
      });
      const response = await this.session.sendApplicationDataMessage(message);

      const codeLimit = (<ObjectTypeCapacitiesResponse>response).capcity;

      // Get Code names
      for(let i = 1; i <= codeLimit; i++) {
        const properties = await this.getCodeProperties(i);
        if (properties !== undefined) {
          codes.set(i, properties);
        }
      }
    } catch(error) {
      this.platform.log.error(error);
      throw error;      
    }

    return codes;
  }

  async getCodeProperties(index: number): Promise<CodePropertiesResponse | undefined> {
    this.platform.log.debug(this.constructor.name, 'getCodeProperties', index);

    const message = new ObjectPropertiesRequest({
      objectType: ObjectTypes.Code,
      index: index,
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

  async setTime(): Promise<void> {
    this.platform.log.debug(this.constructor.name, 'setTime');

    const now = new Date();

    try {
      this.platform.log.info('Sync controller\'s date and time with host:', now.toLocaleString());

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
  
      const response = await this.session.sendApplicationDataMessage(message);

      this.emit(`button-${buttonId}`);

      if (response.type !== MessageTypes.Acknowledge) {
        throw new Error('Acknowledgement not received');
      }
    } catch(error) {
      this.platform.log.warn(`Execute Button ${buttonId} failed: ${error.message}`);
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
        return this.createAreaStatus(response.areas.get(areaId)!);
      }
    } catch(error) {
      this.platform.log.error(error);
      throw error;  
    }
  }

  private createAreaStatus(area: ExtendedAreaStatus): AreaStatus {
    this.platform.log.debug(this.constructor.name, 'createAreaStatus', area);

    let alarmMode: AlarmModes;
    
    switch (area.mode) {
      case SecurityModes.Off:
        alarmMode = AlarmModes.Disarmed;
        break;
      case SecurityModes.Day:
      case SecurityModes.DayInstant:
      case SecurityModes.ArmingDay:
      case SecurityModes.ArmingDayInstant:
        alarmMode = AlarmModes.ArmedDay;
        break;
      case SecurityModes.Night:
      case SecurityModes.NightDelayed:
      case SecurityModes.ArmingNight:
      case SecurityModes.ArmingNightDelayed:
        alarmMode = AlarmModes.ArmedNight;
        break;
      default:
        alarmMode = AlarmModes.ArmedAway;
        break;
    }

    return {
      burglaryTriggered: (area!.alarms & Alarms.Burglary) === Alarms.Burglary,
      fireTriggered: (area!.alarms & Alarms.Fire) === Alarms.Fire,
      gasTriggered: (area!.alarms & Alarms.Gas) === Alarms.Gas,
      auxiliaryTriggered: (area!.alarms & Alarms.Auxiliary) === Alarms.Auxiliary,
      freezeTriggered: (area!.alarms & Alarms.Freeze) === Alarms.Freeze,
      waterTriggered: (area!.alarms & Alarms.Water) === Alarms.Water,
      duressTriggered: (area!.alarms & Alarms.Duress) === Alarms.Duress,
      temperatureTriggered: (area!.alarms & Alarms.Temperature) === Alarms.Temperature,
      alarmMode: alarmMode,
    };
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
        return this.createZoneStatus(response.zones.get(zoneId)!);
      }
    } catch(error) {
      this.platform.log.error(error);
      throw error;  
    }
  }

  private createZoneStatus(zone: ExtendedZoneStatus): ZoneStatus {
    this.platform.log.debug(this.constructor.name, 'createZoneStatus', zone);

    const ready = (zone.currentState & ZoneCurrentStates.NotReady) === 0;
    const trouble = (zone.currentState & ZoneCurrentStates.Trouble) > 0;

    return {
      ready: ready,
      trouble: trouble,
    };
  }

  async setAreaAlarmMode(area: number, mode: AlarmModes): Promise<void> {
    this.platform.log.debug(this.constructor.name, 'setAlarmState', area, mode);

    try {
      const codeId = await this.getCodeId(area);
      if (codeId === undefined) {
        return;
      }

      this.platform.log.info('Using security code for', this.codes.get(codeId)?.name);

      let command: Commands = Commands.Disarm;

      switch(mode) {
        case AlarmModes.ArmedDay:
          command = Commands.ArmDay;
          break;
        case AlarmModes.ArmedNight:
          command = Commands.ArmNight;
          break;
        case AlarmModes.ArmedAway:
          command = Commands.ArmAway;
          break;
      }

      const message = new ControllerCommandRequest({
        command: command,
        parameter1: this.codes.keys[0],
        parameter2: area,
      });
  
      const response = await this.session.sendApplicationDataMessage(message);

      if (response.type !== MessageTypes.Acknowledge) {
        throw new Error('Acknowledgement not received');
      }
    } catch(error) {
      this.platform.log.warn(`Set Alarm Mode failed: ${error.message}`);
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

  // Event Handlers
  areaStatusHandler(areas: Map<number, ExtendedAreaStatus>): void {
    this.platform.log.debug(this.constructor.name, 'areaStatusHandler', areas);

    try {
      for(const [areaId, status] of areas.entries()) {
        const areaStatus = this.createAreaStatus(status);
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

    let mode = 'Disarmed';
    switch(areaStatus.alarmMode) {
      case AlarmModes.ArmedAway:
        mode = 'Armed Away';
        break;
      case AlarmModes.ArmedDay:
        mode = 'Armed Day';
        break;
      case AlarmModes.ArmedNight:
        mode = 'Armed Night';
        break;
    }

    const triggered = areaStatus.burglaryTriggered || areaStatus.fireTriggered || areaStatus.gasTriggered
      || areaStatus.auxiliaryTriggered || areaStatus.freezeTriggered || areaStatus.waterTriggered
      || areaStatus.duressTriggered || areaStatus.temperatureTriggered;

    return `${areaName}: ${mode}${triggered ? ', Alarm triggered' : ''}`;
  }

  zoneStatusHandler(zones: Map<number, ExtendedZoneStatus>): void {
    this.platform.log.debug(this.constructor.name, 'zoneStatusHandler', zones);

    try {
      for(const [zoneId, status] of zones.entries()) {
        const zoneStatus = this.createZoneStatus(status);
        if (this.platform.settings.showOmniEvents) {
          const name = this.zones.get(zoneId)!.name;
          this.platform.log.info(`${name}: ${zoneStatus.ready ? 'Ready' : 'Not Ready'}${zoneStatus.trouble ? ', Trouble' : ''}`);
        }
        this.emit(`zone-${zoneId}`, zoneStatus);
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
}