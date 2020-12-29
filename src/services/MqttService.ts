import mqtt = require('async-mqtt');

import { OmniLinkPlatform } from '../platform';
import { MqttSettings } from '../models/Settings';
import { AreaStatus, ExtendedArmedModes, Alarms } from '../models/AreaStatus';
import { ZoneStatus } from '../models/ZoneStatus';
import { UnitStatus, UnitStates } from '../models/UnitStatus';
import { ThermostatStatus, ThermostatModes, ThermostatStates } from '../models/ThermostatStatus';
import { TemperatureFormats } from '../omni/messages/SystemFormatsResponse';
import { SystemTroubles, EmergencyTypes } from '../omni/messages/enums';

export class MqttService {
  private settings: MqttSettings | undefined;
  private client!: mqtt.AsyncMqttClient;
  private readonly subTopics: Map<string, (topic: string, payload: string) => Promise<void>> = new Map();
  private readonly pubTopics: Map<string, string> = new Map();
  private readonly prefix: string;
  private readonly armModes: string[] = ['off', 'away', 'night', 'day', 'vacation', 'day_instant', 'night_delayed'];
  private readonly alarmModes: string[] = ['burglary', 'fire', 'auxiliary'];
  private readonly unitStates: string[] = ['off', 'on'];
  private readonly thermostatModes: string[] = ['off', 'cool', 'heat', 'auto'];

  constructor(
    private readonly platform: OmniLinkPlatform,
  ) {
    this.settings = platform.settings.mqtt;
    this.prefix = (this.settings?.topicPrefix !== undefined)
      ? `${this.settings.topicPrefix}/`
      : '';
  }

  async init(): Promise<void> {
    this.platform.log.debug(this.constructor.name, 'init');

    try {
      if (this.settings === undefined) {
        return;
      }

      if (this.settings.host === undefined) {
        this.platform.log.info('MQTT: No broker host defined');
        return;
      }
  
      await this.connect();

      // Areas
      for(const areaId of this.platform.omniService.areas.keys()) {
        this.subTopics.set(`${this.prefix}area/${areaId}/arm/set`, this.setAreaArm.bind(this));

        this.subTopics.set(`${this.prefix}area/${areaId}/alarm/set`, this.setAreaAlarm.bind(this));

        this.platform.omniService.on(`area-${areaId}`, this.publishArea.bind(this, areaId));

        const areaStatus = await this.platform.omniService.getAreaStatus(areaId);
        if (areaStatus !== undefined) {
          this.publishArea(areaId, areaStatus);
        }
      }

      // Zones
      for(const zoneId of this.platform.omniService.zones.keys()) {
        this.platform.omniService.on(`zone-${zoneId}`, this.publishZone.bind(this, zoneId));

        const zoneStatus = await this.platform.omniService.getZoneStatus(zoneId);
        if (zoneStatus !== undefined) {
          this.publishZone(zoneId, zoneStatus);
        }
      }

      // Units
      for(const unitId of this.platform.omniService.units.keys()) {
        this.subTopics.set(`${this.prefix}unit/${unitId}/state/set`, this.setUnitState.bind(this));
        this.subTopics.set(`${this.prefix}unit/${unitId}/brightness/set`, this.setUnitBrightness.bind(this));

        this.platform.omniService.on(`unit-${unitId}`, this.publishUnit.bind(this, unitId));

        const unitStatus = await this.platform.omniService.getUnitStatus(unitId);
        if (unitStatus !== undefined) {
          this.publishUnit(unitId, unitStatus);
        }
      }

      // Buttons
      for(const buttonId of this.platform.omniService.buttons.keys()) {
        this.subTopics.set(`${this.prefix}button/${buttonId}/execute/set`, this.setButtonExecute.bind(this));

        this.publishButton(buttonId);
      }

      // Thermostats
      for(const thermostatId of this.platform.omniService.thermostats.keys()) {
        this.subTopics.set(`${this.prefix}thermostat/${thermostatId}/mode/set`, this.setThermostatMode.bind(this));
        this.subTopics.set(`${this.prefix}thermostat/${thermostatId}/coolsetpoint/set`, this.setThermostatCoolSetPoint.bind(this));
        this.subTopics.set(`${this.prefix}thermostat/${thermostatId}/heatsetpoint/set`, this.setThermostatHeatSetPoint.bind(this));

        this.platform.omniService.on(`thermostat-${thermostatId}`, this.publishThermostat.bind(this, thermostatId));

        const thermostatStatus = await this.platform.omniService.getThermostatStatus(thermostatId);
        if (thermostatStatus !== undefined) {
          this.publishThermostat(thermostatId, thermostatStatus);
        }
      }

      // System Troubles
      this.platform.omniService.on('system-troubles', this.publishSystemTroubles.bind(this));
      const response = await this.platform.omniService.getSystemTroubles();
      if (response !== undefined) {
        this.publishSystemTroubles(response.troubles);
      }

      await this.subscribe();

    } catch (error) {
      this.platform.log.error(error);
    }
  }

  async connect(): Promise<void> {
    this.platform.log.debug(this.constructor.name, 'connect');

    const url = `${this.settings!.host}:${this.settings!.port}`;
    const options: mqtt.IClientOptions = {
      username: <string | undefined>this.settings!.username,
      password: <string | undefined>this.settings!.password,
    };

    let connected = false;
    while(!connected) {
      try {
        this.client = await mqtt.connectAsync(url, options);
        connected = true;
      } catch(error) {
        this.platform.log.warn(`Failed to connect to MQTT broker. Error: ${error.message}`);
        this.platform.log.warn('Will try again in 1 minute');
        await this.delay(60000);
      }
    }

    this.platform.log.info(`MQTT: Broker connected [${url}]`);
  }

  // Subscriptions
  async subscribe(): Promise<void> {
    this.platform.log.debug(this.constructor.name, 'subscribe');

    for(const topic of this.subTopics.keys()) {
      if (this.settings!.showMqttEvents) {
        this.platform.log.info(`MQTT: Subscribe: ${topic}`);
      }
      await this.client.subscribe(topic);
    }

    this.client.on('message', async (topic, payload) => {
      if (this.settings!.showMqttEvents) {
        this.platform.log.info(`MQTT: Received: ${topic}, Payload: ${payload}`);
      }
      await this.subTopics.get(topic)!(topic.replace(this.prefix, ''), payload.toString());
    });
  }

  async setAreaArm(topic: string, payload: string): Promise<void> {
    this.platform.log.debug(this.constructor.name, 'setAreaArm', topic, payload);

    if (!this.armModes.includes(payload)) {
      return;
    }

    let armedMode = ExtendedArmedModes.Disarmed;

    switch(payload) {
      case 'away':
        armedMode = ExtendedArmedModes.ArmedAway;
        break;
      case 'night':
        armedMode = ExtendedArmedModes.ArmedNight;
        break;
      case 'day':
        armedMode = ExtendedArmedModes.ArmedDay;
        break;
      case 'vacation':
        armedMode = ExtendedArmedModes.ArmedVacation;
        break;
      case 'night_delayed':
        armedMode = ExtendedArmedModes.ArmedNightDelayed;
        break;
      case 'day_instant':
        armedMode = ExtendedArmedModes.ArmedDayInstant;
        break;
    }

    await this.platform.omniService.setAreaAlarmMode(this.getObjectId(topic), armedMode);
  }

  async setAreaAlarm(topic: string, payload: string): Promise<void> {
    this.platform.log.debug(this.constructor.name, 'setAreaAlarm', topic, payload);

    if (!this.alarmModes.includes(payload)) {
      return;
    }

    let emergencyType = EmergencyTypes.Burglary;

    switch(payload) {
      case 'fire':
        emergencyType = EmergencyTypes.Fire;
        break;
      case 'auxiliary':
        emergencyType = EmergencyTypes.Auxiliary;
        break;
    }

    await this.platform.omniService.setEmergencyAlarm(this.getObjectId(topic), emergencyType);
  }

  async setButtonExecute(topic: string, payload: string): Promise<void> {
    this.platform.log.debug(this.constructor.name, 'setButtonExecute', topic, payload);

    if (payload !== 'true') {
      return;
    }

    await this.platform.omniService.executeButton(this.getObjectId(topic));
  }

  async setUnitState(topic: string, payload: string): Promise<void> {
    this.platform.log.debug(this.constructor.name, 'setUnitState', topic, payload);

    if (!this.unitStates.includes(payload)) {
      return;
    }

    await this.platform.omniService.setUnitState(this.getObjectId(topic), payload === 'on');
  }

  async setUnitBrightness(topic: string, payload: string): Promise<void> {
    this.platform.log.debug(this.constructor.name, 'setUnitBrightness', topic, payload);
    
    const brightness = Number(payload);
    if (isNaN(brightness)) {
      return;
    }

    await this.platform.omniService.setUnitBrightness(this.getObjectId(topic), brightness);
  }

  async setThermostatMode(topic: string, payload: string): Promise<void> {
    this.platform.log.debug(this.constructor.name, 'setThermostatMode', topic, payload);

    if (!this.thermostatModes.includes(payload)) {
      return;
    }

    let thermostatMode = ThermostatModes.Off;
    switch(payload) {
      case 'cool':
        thermostatMode = ThermostatModes.Cool;
        break;
      case 'heat':
        thermostatMode = ThermostatModes.Heat;
        break;
      case 'auto':
        thermostatMode = ThermostatModes.Auto;
        break;
      case 'emergencyheat':
        thermostatMode = ThermostatModes.EmergencyHeat;
        break;
    }

    await this.platform.omniService.setThermostatMode(this.getObjectId(topic), thermostatMode);
  }

  async setThermostatCoolSetPoint(topic: string, payload: string): Promise<void> {
    this.platform.log.debug(this.constructor.name, 'setThermostatCoolSetPoint', topic, payload);

    const temperature = this.parseTemperature(payload);
    if (temperature === undefined) {
      return;
    }

    await this.platform.omniService.setThermostatCoolSetPoint(this.getObjectId(topic), temperature);
  }

  async setThermostatHeatSetPoint(topic: string, payload: string): Promise<void> {
    this.platform.log.debug(this.constructor.name, 'setThermostatHeatSetPoint', topic, payload);

    const temperature = this.parseTemperature(payload);
    if (temperature === undefined) {
      return;
    }

    await this.platform.omniService.setThermostatHeatSetPoint(this.getObjectId(topic), temperature);
  }

  // Publications
  private async publish(topic: string, payload: string): Promise<void> {
    this.platform.log.debug(this.constructor.name, 'publish', topic, payload);

    try {
      topic = this.prefix + topic;

      // Only publish if changed
      if (this.pubTopics.has(topic) && this.pubTopics.get(topic) === payload) {
        return;
      }
      this.pubTopics.set(topic, payload);

      await this.client.publish(topic, payload, {retain: true});
      if (this.settings!.showMqttEvents) {
        this.platform.log.info(`MQTT: Publish: ${topic}, Payload: ${payload}`);
      }
    } catch (error) {
      this.platform.log.error(error);
    }
  }

  publishArea(areaId: number, areaStatus: AreaStatus) {
    this.platform.log.debug(this.constructor.name, 'publishArea', areaId, areaStatus);

    this.publish(`area/${areaId}/name/get`, this.platform.omniService.areas.get(areaId)!.name);

    // Arm State
    let armedMode = 'off';
    switch(areaStatus.extendedArmedMode) {
      case ExtendedArmedModes.ArmedAway:
        armedMode = 'away';
        break;
      case ExtendedArmedModes.ArmedNight:
        armedMode = 'night';
        break;
      case ExtendedArmedModes.ArmedDay:
        armedMode = 'day';
        break;
      case ExtendedArmedModes.ArmedVacation:
        armedMode = 'vacation';
        break;
      case ExtendedArmedModes.ArmedDayInstant:
        armedMode = 'day_instant';
        break;
      case ExtendedArmedModes.ArmedNightDelayed:
        armedMode = 'night_delayed';
        break;
    }

    this.publish(`area/${areaId}/arm/get`, armedMode);

    // Triggered Alarms
    for(const alarm in Alarms) {
      const alarmMode = Number(alarm);
      if (isNaN(alarmMode)) {
        continue;
      }
      this.publish(`area/${areaId}/${Alarms[alarmMode].toLowerCase()}/get`, String(areaStatus.alarmsTriggered.includes(alarmMode)));
    }
  }

  publishZone(zoneId: number, zoneStatus: ZoneStatus) {
    this.platform.log.debug(this.constructor.name, 'publishZone', zoneId, zoneStatus);

    this.publish(`zone/${zoneId}/name/get`, this.platform.omniService.zones.get(zoneId)!.name);
    this.publish(`zone/${zoneId}/ready/get`, String(zoneStatus.ready));
    this.publish(`zone/${zoneId}/trouble/get`, String(zoneStatus.trouble));
  }

  publishButton(buttonId: number) {
    this.platform.log.debug(this.constructor.name, 'publishButton', buttonId);

    this.publish(`button/${buttonId}/name/get`, this.platform.omniService.buttons.get(buttonId)!.name);
  }

  publishUnit(unitId: number, unitStatus: UnitStatus) {
    this.platform.log.debug(this.constructor.name, 'publishUnit', unitId, unitStatus);

    this.publish(`unit/${unitId}/name/get`, this.platform.omniService.units.get(unitId)!.name);

    const payload = unitStatus.state === UnitStates.On ? 'on' : 'off';
    this.publish(`unit/${unitId}/state/get`, payload);

    if (unitStatus.brightness !== undefined) {
      this.publish(`unit/${unitId}/brightness/get`, String(unitStatus.brightness));
    }
  }

  publishThermostat(thermostatId: number, thermostatStatus: ThermostatStatus) {
    this.platform.log.debug(this.constructor.name, 'publishThermostat', thermostatId, thermostatStatus);

    this.publish(`thermostat/${thermostatId}/name/get`, this.platform.omniService.thermostats.get(thermostatId)!.name);
  
    this.publish(`thermostat/${thermostatId}/mode/get`,
      ThermostatModes[thermostatStatus.mode].toLowerCase());

    this.publish(`thermostat/${thermostatId}/temperature/get`,
      this.formatTemperature(thermostatStatus.currentTemperature));

    this.publish(`thermostat/${thermostatId}/coolsetpoint/get`,
      this.formatTemperature(thermostatStatus.coolSetPoint));

    this.publish(`thermostat/${thermostatId}/heatsetpoint/get`,
      this.formatTemperature(thermostatStatus.heatSetPoint));

    this.publish(`thermostat/${thermostatId}/state/get`,
      ThermostatStates[thermostatStatus.state].toLowerCase());
  }

  publishSystemTroubles(troubles: SystemTroubles[]) {
    this.platform.log.debug(this.constructor.name, 'publishSystemTroubles', troubles);

    for(const trouble in SystemTroubles) {
      const troubleType = Number(trouble);
      if (isNaN(troubleType)) {
        continue;
      }
      this.publish(`system/troubles/${SystemTroubles[troubleType].toLowerCase()}/get`, String(troubles.includes(troubleType)));
    }
  }

  // Helpers
  private async delay(ms: number): Promise<void> {
    await new Promise((resolve) => {
      setTimeout(resolve, ms);
    });
  }

  private getObjectId(topic: string): number {
    topic = topic.replace(this.prefix, '');
    return Number(topic.split('/')[1]);
  }

  private formatTemperature(temperature: number): string {
    if (this.platform.omniService.temperatureFormat === TemperatureFormats.Celsius) {
      return String(temperature);
    }
    return String(Math.round(((temperature * 9.0 / 5.0) + 32.0) * 10.0) / 10.0);
  }

  private parseTemperature(value: string): number | undefined {
    const temperature = Number(value);
    if (isNaN(temperature)) {
      return;
    }
    if (this.platform.omniService.temperatureFormat === TemperatureFormats.Celsius) {
      return temperature;
    }
    return Math.round(((temperature - 32.0) * 5.0 / 9.0) * 2.0) / 2.0;
  }
}