import mqtt = require('async-mqtt');

import { OmniLinkPlatform } from '../platform';
import { MqttSettings } from '../models/Settings';
import { AreaStatus, ArmedModes, Alarms } from '../models/AreaStatus';
import { ZoneStatus } from '../models/ZoneStatus';
import { UnitStatus, UnitStates } from '../models/UnitStatus';
import { SystemTroubles } from '../omni/messages/enums';

export class MqttService {
  private settings: MqttSettings | undefined;
  private client!: mqtt.AsyncMqttClient;
  private readonly subTopics: Map<string, (topic: string, payload: string) => Promise<void>> = new Map();
  private readonly pubTopics: Map<string, string> = new Map();
  private readonly prefix: string;
  private readonly armModes: string[] = ['off', 'away', 'night', 'day'];
  private readonly unitStates: string[] = ['off', 'on'];

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

        this.platform.omniService.on(`unit-${unitId}`, this.publishUnitState.bind(this, unitId));

        const unitStatus = await this.platform.omniService.getUnitStatus(unitId);
        if (unitStatus !== undefined) {
          this.publishUnitState(unitId, unitStatus);
        }
      }

      // Buttons
      for(const buttonId of this.platform.omniService.buttons.keys()) {
        this.subTopics.set(`${this.prefix}button/${buttonId}/execute/set`, this.setButtonExecute.bind(this));
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

    topic = topic.replace(this.prefix, '');
    const areaId = Number(topic.split('/')[1]);

    let armedMode = ArmedModes.Disarmed;

    switch(payload) {
      case 'away':
        armedMode = ArmedModes.ArmedAway;
        break;
      case 'night':
        armedMode = ArmedModes.ArmedNight;
        break;
      case 'day':
        armedMode = ArmedModes.ArmedDay;
        break;
    }

    await this.platform.omniService.setAreaAlarmMode(areaId, armedMode);
  }

  async setButtonExecute(topic: string, payload: string): Promise<void> {
    this.platform.log.debug(this.constructor.name, 'setButtonExecute', topic, payload);

    if (payload !== 'true') {
      return;
    }

    topic = topic.replace(this.prefix, '');
    const buttonId = Number(topic.split('/')[1]);

    await this.platform.omniService.executeButton(buttonId);
  }

  async setUnitState(topic: string, payload: string): Promise<void> {
    this.platform.log.debug(this.constructor.name, 'setUnitState', topic, payload);

    if (!this.unitStates.includes(payload)) {
      return;
    }

    topic = topic.replace(this.prefix, '');
    const unitId = Number(topic.split('/')[1]);

    await this.platform.omniService.setUnitState(unitId, payload === 'on');
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

    // Arm State
    let armedMode = 'off';
    switch(areaStatus.armedMode) {
      case ArmedModes.ArmedAway:
        armedMode = 'away';
        break;
      case ArmedModes.ArmedNight:
        armedMode = 'night';
        break;
      case ArmedModes.ArmedDay:
        armedMode = 'day';
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

    this.publish(`zone/${zoneId}/ready/get`, String(zoneStatus.ready));
    this.publish(`zone/${zoneId}/trouble/get`, String(zoneStatus.trouble));
  }

  publishUnitState(unitId: number, unitStatus: UnitStatus) {
    this.platform.log.debug(this.constructor.name, 'publishZone', unitId, unitStatus);

    const payload = unitStatus.state === UnitStates.On ? 'on' : 'off';

    this.publish(`unit/${unitId}/state/get`, payload);
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
}