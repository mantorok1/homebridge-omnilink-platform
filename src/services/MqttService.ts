import mqtt = require('async-mqtt');

import { OmniLinkPlatform } from '../platform';
import { MqttSettings } from '../models/Settings';
import { AreaStatus, ExtendedArmedModes, Alarms } from '../models/Area';
import { ZoneStatus } from '../models/Zone';
import { UnitStatus, UnitStates } from '../models/Unit';
import { ThermostatStatus, ThermostatModes, ThermostatStates, HoldStates } from '../models/Thermostat';
import { AccessControlLockStatus } from '../models/AccessControl';
import { AuxiliarySensorStatus } from '../models/AuxiliarySensor';
import { EmergencyTypes } from '../omni/messages/enums';
import { SystemTroubles } from '../models/OmniObjectModel';
import { OmniObjectStatusTypes } from '../models/OmniObjectBase';
import { TemperatureFormats } from '../models/SystemFormats';

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
  private readonly thermostatHoldStates: string[] = ['off', 'hold', 'vacationhold'];

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
      for(const [areaId, area] of this.platform.omniService.omni.areas.entries()) {
        this.subTopics.set(`${this.prefix}area/${areaId}/arm/set`, this.setAreaArm.bind(this));
        this.subTopics.set(`${this.prefix}area/${areaId}/alarm/set`, this.setAreaAlarm.bind(this));

        this.platform.omniService.on(this.platform.omniService.getEventKey(OmniObjectStatusTypes.Area, areaId),
          this.publishArea.bind(this, areaId));

        this.publishArea(areaId, area.status);
      }

      // Zones
      for(const [zoneId, zone] of this.platform.omniService.omni.zones.entries()) {
        this.subTopics.set(`${this.prefix}zone/${zoneId}/bypass/set`, this.setBypassZone.bind(this));

        this.platform.omniService.on(this.platform.omniService.getEventKey(OmniObjectStatusTypes.Zone, zoneId),
          this.publishZone.bind(this, zoneId));

        this.publishZone(zoneId, zone.status);
      }

      // Units
      for(const [unitId, unit] of this.platform.omniService.omni.units.entries()) {
        this.subTopics.set(`${this.prefix}unit/${unitId}/state/set`, this.setUnitState.bind(this));
        this.subTopics.set(`${this.prefix}unit/${unitId}/brightness/set`, this.setUnitBrightness.bind(this));

        this.platform.omniService.on(this.platform.omniService.getEventKey(OmniObjectStatusTypes.Unit, unitId),
          this.publishUnit.bind(this, unitId));

        this.publishUnit(unitId, unit.status);
      }

      // Buttons
      for(const buttonId of this.platform.omniService.omni.buttons.keys()) {
        this.subTopics.set(`${this.prefix}button/${buttonId}/execute/set`, this.setButtonExecute.bind(this));

        this.publishButton(buttonId);
      }

      // Thermostats
      for(const [thermostatId, thermostat] of this.platform.omniService.omni.thermostats.entries()) {
        this.subTopics.set(`${this.prefix}thermostat/${thermostatId}/mode/set`, this.setThermostatMode.bind(this));
        this.subTopics.set(`${this.prefix}thermostat/${thermostatId}/coolsetpoint/set`, this.setThermostatCoolSetPoint.bind(this));
        this.subTopics.set(`${this.prefix}thermostat/${thermostatId}/heatsetpoint/set`, this.setThermostatHeatSetPoint.bind(this));
        this.subTopics.set(`${this.prefix}thermostat/${thermostatId}/humidifysetpoint/set`,
          this.setThermostatHumidifySetPoint.bind(this));
        this.subTopics.set(`${this.prefix}thermostat/${thermostatId}/dehumidifysetpoint/set`,
          this.setThermostatDehumidifySetPoint.bind(this));

        this.platform.omniService.on(this.platform.omniService.getEventKey(OmniObjectStatusTypes.Thermostat, thermostatId),
          this.publishThermostat.bind(this, thermostatId));

        this.publishThermostat(thermostatId, thermostat.status);
      }

      // Access Controls
      for(const [accessControlId, accessControl] of this.platform.omniService.omni.accessControls.entries()) {
        this.subTopics.set(`${this.prefix}accesscontrol/${accessControlId}/locked/set`, this.setLockedState.bind(this));

        this.platform.omniService.on(this.platform.omniService.getEventKey(OmniObjectStatusTypes.AccessControlLock, accessControlId),
          this.publishLock.bind(this, accessControlId));

        this.publishLock(accessControlId, accessControl.lockStatus);
      }

      // Auxiliary Sensors
      for(const [sensorId, sensor] of this.platform.omniService.omni.sensors.entries()) {
        this.platform.omniService.on(this.platform.omniService.getEventKey(OmniObjectStatusTypes.AuxiliarySensor, sensorId),
          this.publishAuxiliarySensor.bind(this, sensorId));

        this.publishAuxiliarySensor(sensorId, sensor.status);
      }

      // System Troubles
      this.platform.omniService.on('system-troubles', this.publishSystemTroubles.bind(this));
      const response = await this.platform.omniService.getSystemTroubles();
      if (response !== undefined) {
        this.publishSystemTroubles(response.troubles);
      }

      await this.subscribe();

    } catch (error) {
      if (error instanceof Error) {
        this.platform.log.error(error.message);
      }
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
        if (error instanceof Error) {
          this.platform.log.warn(`Failed to connect to MQTT broker. Error: ${error.message}`);
          this.platform.log.warn('Will try again in 1 minute');
          await this.delay(60000);
        }
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

  async setBypassZone(topic: string, payload: string): Promise<void> {
    this.platform.log.debug(this.constructor.name, 'setBypassZone', topic, payload);

    if (payload !== 'true' && payload !== 'false' ) {
      return;
    }

    await this.platform.omniService.setZoneBypass(this.getObjectId(topic), payload === 'true');
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

  async setThermostatHoldState(topic: string, payload: string): Promise<void> {
    this.platform.log.debug(this.constructor.name, 'setThermostatHoldState', topic, payload);

    if (!this.thermostatHoldStates.includes(payload)) {
      return;
    }

    let holdState = HoldStates.Off;
    switch(payload) {
      case 'hold':
        holdState = HoldStates.Hold;
        break;
      case 'vacationhold':
        holdState = HoldStates.VacationHold;
        break;
    }

    await this.platform.omniService.setThermostatHoldState(this.getObjectId(topic), holdState);
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

  async setThermostatHumidifySetPoint(topic: string, payload: string): Promise<void> {
    this.platform.log.debug(this.constructor.name, 'setThermostatHumidifySetPoint', topic, payload);

    const humidity = this.parseHumidity(payload);
    if (humidity === undefined) {
      return;
    }

    await this.platform.omniService.setThermostatHumidifySetPoint(this.getObjectId(topic), humidity);
  }

  async setThermostatDehumidifySetPoint(topic: string, payload: string): Promise<void> {
    this.platform.log.debug(this.constructor.name, 'setThermostatDehumidifySetPoint', topic, payload);

    const humidity = this.parseHumidity(payload);
    if (humidity === undefined) {
      return;
    }

    await this.platform.omniService.setThermostatDehumidifySetPoint(this.getObjectId(topic), humidity);
  }

  async setLockedState(topic: string, payload: string): Promise<void> {
    this.platform.log.debug(this.constructor.name, 'setLockedState', topic, payload);

    if (payload !== 'true' && payload !== 'false' ) {
      return;
    }

    await this.platform.omniService.setLockState(this.getObjectId(topic), payload === 'true');
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
      if (error instanceof Error) {
        this.platform.log.error(error.message);
      }
    }
  }

  publishArea(areaId: number, status: AreaStatus) {
    this.platform.log.debug(this.constructor.name, 'publishArea', areaId, status);

    this.publish(`area/${areaId}/name/get`, this.platform.omniService.omni.areas[areaId].name);

    // Arm State
    let armedMode = 'off';
    switch(status.extendedArmedMode) {
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
      this.publish(`area/${areaId}/${Alarms[alarmMode].toLowerCase()}/get`, String(status.alarmsTriggered.includes(alarmMode)));
    }
  }

  publishZone(zoneId: number, status: ZoneStatus) {
    this.platform.log.debug(this.constructor.name, 'publishZone', zoneId, status);

    this.publish(`zone/${zoneId}/name/get`, this.platform.omniService.omni.zones[zoneId].name);
    this.publish(`zone/${zoneId}/ready/get`, String(status.ready));
    this.publish(`zone/${zoneId}/trouble/get`, String(status.trouble));
    this.publish(`zone/${zoneId}/bypass/get`, String(status.bypassed));
  }

  publishButton(buttonId: number) {
    this.platform.log.debug(this.constructor.name, 'publishButton', buttonId);

    this.publish(`button/${buttonId}/name/get`, this.platform.omniService.omni.buttons[buttonId].name);
  }

  publishUnit(unitId: number, status: UnitStatus) {
    this.platform.log.debug(this.constructor.name, 'publishUnit', unitId, status);

    this.publish(`unit/${unitId}/name/get`, this.platform.omniService.omni.units[unitId].name);

    const payload = status.state === UnitStates.On ? 'on' : 'off';
    this.publish(`unit/${unitId}/state/get`, payload);

    if (status.brightness !== undefined) {
      this.publish(`unit/${unitId}/brightness/get`, String(status.brightness));
    }
  }

  publishThermostat(thermostatId: number, status: ThermostatStatus) {
    this.platform.log.debug(this.constructor.name, 'publishThermostat', thermostatId, status);

    this.publish(`thermostat/${thermostatId}/name/get`,
      this.platform.omniService.omni.thermostats[thermostatId].name);
  
    this.publish(`thermostat/${thermostatId}/mode/get`,
      ThermostatModes[status.mode].toLowerCase());

    this.publish(`thermostat/${thermostatId}/hold/get`,
      HoldStates[status.hold].toLowerCase());

    this.publish(`thermostat/${thermostatId}/temperature/get`,
      String(status.temperature.toFormat()));

    this.publish(`thermostat/${thermostatId}/coolsetpoint/get`,
      String(status.coolSetPoint.toFormat()));

    this.publish(`thermostat/${thermostatId}/heatsetpoint/get`,
      String(status.heatSetPoint.toFormat()));

    this.publish(`thermostat/${thermostatId}/state/get`,
      ThermostatStates[status.state].toLowerCase());

    this.publish(`thermostat/${thermostatId}/humidity/get`,
      String(status.humidity.toFormat()));
    
    this.publish(`thermostat/${thermostatId}/humidifysetpoint/get`,
      String(status.humidifySetPoint.toFormat()));
    
    this.publish(`thermostat/${thermostatId}/dehumidifysetpoint/get`,
      String(status.dehumidifySetPoint.toFormat()));
  }

  publishLock(accessControlId: number, lockStatus: AccessControlLockStatus) {
    this.platform.log.debug(this.constructor.name, 'publishLock', accessControlId, lockStatus);

    this.publish(`accesscontrol/${accessControlId}/name/get`,
      this.platform.omniService.omni.accessControls[accessControlId].name);
  
    this.publish(`accesscontrol/${accessControlId}/locked/get`,
      String(lockStatus.locked));
  }

  publishAuxiliarySensor(sensorId: number, status: AuxiliarySensorStatus) {
    this.platform.log.debug(this.constructor.name, 'publishAuxiliarySensor', sensorId, status);

    this.publish(`auxiliary/${sensorId}/name/get`, this.platform.omniService.omni.sensors[sensorId].name);

    if (this.platform.omniService.omni.sensors[sensorId].isTemperatureSensor) {
      this.publish(`auxiliary/${sensorId}/temperature/get`, String(status.temperature.toFormat()));
    } else { // Humidity sensor
      this.publish(`auxiliary/${sensorId}/humidity/get`, String(status.temperature.toFormat()));
    } 
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

  private parseTemperature(value: string): number | undefined {
    const temperature = Number(value);
    if (isNaN(temperature)) {
      return;
    }
    if (this.platform.omniService.omni.formats.temperature === TemperatureFormats.Celsius) {
      return temperature;
    }
    return Math.round(((temperature - 32.0) * 5.0 / 9.0) * 2.0) / 2.0;
  }

  private parseHumidity(value: string): number | undefined {
    const humidity = Number(value);
    return isNaN(humidity)
      ? undefined
      : Math.round(humidity);
  }
}