import { PlatformAccessory } from 'homebridge';
import { PLATFORM_NAME, PLUGIN_NAME } from '../settings';
import { OmniLinkPlatform } from '../platform';
import { ZoneTypes } from '../omni/OmniService';
import { AccessoryBase } from './AccessoryBase';
import { SecuritySystem } from './SecuritySystem';
import { ButtonSwitch } from './ButtonSwitch';
import { MotionSensor } from './MotionSensor';
import { SmokeSensor } from './SmokeSensor';
import { ContactSensor } from './ContactSensor';
import { GarageDoorOpener } from './GarageDoorOpener';

export class AccessoryService {
  private accessories: Map<string, AccessoryBase> = new Map();

  constructor(
    private readonly platform: OmniLinkPlatform,
  ) { }

  discover(): void {
    this.platform.log.debug(this.constructor.name, 'discover');

    try {
      this.discoverAreaSecuritySystems();
      this.discoverZoneMotionSensors();
      this.discoverZoneSmokeSensors();
      this.discoverZoneContactSensors();
      this.discoverButtonSwitches();
      this.discoverGarageDoors();
    } catch (error) {
      this.platform.log.error(error);
    }
  }

  discoverAreaSecuritySystems(): void {
    this.platform.log.debug(this.constructor.name, 'discoverAreaSecuritySystems');

    const areas = new Map<number, string>();

    if (this.platform.settings.includeAreas) {
      for(const [index, area] of this.platform.omniService.areas) {
        areas.set(index, area.name);
      }
    }

    for(const [index, name] of areas) {
      this.addAccessory(SecuritySystem, SecuritySystem.type, name, index);
    }

    for(const accessory of this.accessories.values()) {
      if (accessory instanceof SecuritySystem) {
        if (!areas.has(accessory.platformAccessory.context.index)) {
          this.removeAccessory(SecuritySystem.type, accessory.platformAccessory.context.index);
        }
      }
    }
  }

  discoverZoneMotionSensors(): void {
    this.platform.log.debug(this.constructor.name, 'discoverZoneMotionSensors');

    const zones = new Map<number, string>();

    if (this.platform.settings.includeZones) {
      for(const [index, zone] of this.platform.omniService.zones) {
        const sensorType = this.platform.settings.sensors.get(index);
        if (sensorType === undefined && zone.zoneType === ZoneTypes.FireEmergency) {
          continue;
        }
        if (sensorType !== undefined && sensorType !== 'Motion') {
          continue;
        }
        if (this.platform.settings.garageDoorZones.includes(index)) {
          continue;
        }
        zones.set(index, zone.name);
      }
    }

    for(const [index, name] of zones) {
      this.addAccessory(MotionSensor, MotionSensor.type, name, index);
    }

    for(const accessory of this.accessories.values()) {
      if (accessory instanceof MotionSensor) {
        if (!zones.has(accessory.platformAccessory.context.index)) {
          this.removeAccessory(MotionSensor.type, accessory.platformAccessory.context.index);
        }
      }
    }
  }

  discoverZoneSmokeSensors(): void {
    this.platform.log.debug(this.constructor.name, 'discoverZoneSmokeSensors');

    const zones = new Map<number, string>();

    if (this.platform.settings.includeZones) {
      for(const [index, zone] of this.platform.omniService.zones) {
        const sensorType = this.platform.settings.sensors.get(index);
        if (sensorType === undefined && zone.zoneType !== ZoneTypes.FireEmergency) {
          continue;
        }
        if (sensorType !== undefined && sensorType !== 'Smoke') {
          continue;
        }
        if (this.platform.settings.garageDoorZones.includes(index)) {
          continue;
        }
        zones.set(index, zone.name);
      }
    }

    for(const [index, name] of zones) {
      this.addAccessory(SmokeSensor, SmokeSensor.type, name, index);
    }

    for(const accessory of this.accessories.values()) {
      if (accessory instanceof SmokeSensor) {
        if (!zones.has(accessory.platformAccessory.context.index)) {
          this.removeAccessory(SmokeSensor.type, accessory.platformAccessory.context.index);
        }
      }
    }
  }

  discoverZoneContactSensors(): void {
    this.platform.log.debug(this.constructor.name, 'discoverZoneContactSensors');

    const zones = new Map<number, string>();

    if (this.platform.settings.includeZones) {
      for(const [index, zone] of this.platform.omniService.zones) {
        const sensorType = this.platform.settings.sensors.get(index);
        if (sensorType === undefined) {
          continue;
        }
        if (sensorType !== undefined && sensorType !== 'Contact') {
          continue;
        }
        if (this.platform.settings.garageDoorZones.includes(index)) {
          continue;
        }
        zones.set(index, zone.name);
      }
    }

    for(const [index, name] of zones) {
      this.addAccessory(ContactSensor, ContactSensor.type, name, index);
    }

    for(const accessory of this.accessories.values()) {
      if (accessory instanceof ContactSensor) {
        if (!zones.has(accessory.platformAccessory.context.index)) {
          this.removeAccessory(ContactSensor.type, accessory.platformAccessory.context.index);
        }
      }
    }
  }

  discoverButtonSwitches(): void {
    this.platform.log.debug(this.constructor.name, 'discoverButtonSwitches');

    const buttons = new Map<number, string>();

    if (this.platform.settings.includeButtons) {
      for(const [index, button] of this.platform.omniService.buttons) {
        if (this.platform.settings.garageDoors.has(index)) {
          continue;
        }
        buttons.set(index, button.name);
      }
    }

    for(const [index, name] of buttons) {
      this.addAccessory(ButtonSwitch, ButtonSwitch.type, name, index);
    }

    for(const accessory of this.accessories.values()) {
      if (accessory instanceof ButtonSwitch) {
        if (!buttons.has(accessory.platformAccessory.context.index)) {
          this.removeAccessory(ButtonSwitch.type, accessory.platformAccessory.context.index);
        }
      }
    }
  }

  discoverGarageDoors(): void {
    this.platform.log.debug(this.constructor.name, 'discoverGarageDoors');

    for(const buttonId of this.platform.settings.garageDoors.keys()) {
      const button = this.platform.omniService.buttons.get(buttonId);
      this.addAccessory(GarageDoorOpener, GarageDoorOpener.type, button!.name, buttonId);
    }

    for(const accessory of this.accessories.values()) {
      if (accessory instanceof GarageDoorOpener) {
        if (!this.platform.settings.garageDoors.has(accessory.platformAccessory.context.index)) {
          this.removeAccessory(GarageDoorOpener.type, accessory.platformAccessory.context.index);
        }
      }
    }
  }

  addAccessory<TAccessory extends AccessoryBase>(
    Accessory: new (platform: OmniLinkPlatform, accessory: PlatformAccessory) => TAccessory,
    type: string, name: string, index?: number,
  ): void {
    this.platform.log.debug(this.constructor.name, 'addAccessory', 'Accessory', type, name, index);

    const key: string = this.getKey(type, index);

    if (this.accessories.has(key)) {
      return;
    }

    const uuid: string = this.platform.api.hap.uuid.generate(key);
    const platformAccessory: PlatformAccessory = new this.platform.api.platformAccessory(name, uuid);
    platformAccessory.context.type = type.toLowerCase();
    platformAccessory.context.index = index;
    platformAccessory.context.key = key;

    const accessory = new Accessory(this.platform, platformAccessory);

    this.accessories.set(key, accessory);

    this.platform.api.registerPlatformAccessories(PLUGIN_NAME, PLATFORM_NAME, [platformAccessory]);
    this.platform.log.info(`Add ${type}: ${name}`);
  }

  removeAccessory(type: string, index?: number): void {
    this.platform.log.debug(this.constructor.name, 'removeAccessory', type, index);

    const key: string = this.getKey(type, index);

    if (!this.accessories.has(key)) {
      return;
    }

    const accessory: AccessoryBase = <AccessoryBase>this.accessories.get(key);
    const platformAccessory: PlatformAccessory = accessory.platformAccessory;

    this.platform.api.unregisterPlatformAccessories(PLUGIN_NAME, PLATFORM_NAME, [platformAccessory]);
 
    this.accessories.delete(key);
    this.platform.log.info(`Remove ${type}: ${platformAccessory.displayName}`);
  }

  // Called from configureAccessory
  configure(platformAccessory: PlatformAccessory): void {
    this.platform.log.debug(this.constructor.name, 'configure', 'platformAccessory');

    this.platform.log.info(`Configure ${platformAccessory.context.type}: ${platformAccessory.displayName}`);

    const accessory: AccessoryBase | undefined = this.createAccessory(platformAccessory);

    if (accessory) {
      this.accessories.set(platformAccessory.context.key, accessory);
    }
  }

  createAccessory(platformAccessory: PlatformAccessory): AccessoryBase | undefined {
    this.platform.log.debug(this.constructor.name, 'createAccessory', 'platformAccessory');

    switch(platformAccessory.context.type) {
      case 'button':
        return new ButtonSwitch(this.platform, platformAccessory);
      case 'securitysystem':
        return new SecuritySystem(this.platform, platformAccessory);
      case 'motionsensor':
        return new MotionSensor(this.platform, platformAccessory);
      case 'smokesensor':
        return new SmokeSensor(this.platform, platformAccessory);
      case 'contactsensor':
        return new ContactSensor(this.platform, platformAccessory);
      case 'garagedooropener':
        return new GarageDoorOpener(this.platform, platformAccessory);
    }
  }

  getKey(type: string, index?: number): string {
    this.platform.log.debug(this.constructor.name, 'getKey', type, index);

    return index ? `${type}_${index}` : type;
  }
}