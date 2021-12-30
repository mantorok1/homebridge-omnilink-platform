import { PlatformAccessory } from 'homebridge';
import { PLATFORM_NAME, PLUGIN_NAME } from '../settings';
import { OmniLinkPlatform } from '../platform';
import { AccessoryBase } from './AccessoryBase';
import { SecuritySystem } from './SecuritySystem';
import { ButtonSwitch } from './ButtonSwitch';
import { MotionSensor } from './MotionSensor';
import { SmokeSensor } from './SmokeSensor';
import { ContactSensor } from './ContactSensor';
import { CarbonDioxideSensor } from './CarbonDioxideSensor';
import { CarbonMonoxideSensor } from './CarbonMonoxideSensor';
import { LeakSensor } from './LeakSensor';
import { OccupancySensor } from './OccupancySensor';
import { BypassZoneSwitch } from './BypassZoneSwitch';
import { GarageDoorOpener } from './GarageDoorOpener';
import { UnitSwitch } from './UnitSwitch';
import { UnitLightbulb } from './UnitLightbulb';
import { Thermostat } from './Thermostat';
import { EmergencyAlarmSwitch } from './EmergencyAlarmSwitch';
import { LockMechanism } from './LockMechanism';
import { TemperatureSensor} from './TemperatureSensor';
import { HumiditySensor } from './HumiditySensor';
import { EmergencyTypes } from '../omni/messages/enums';
import { ZoneTypes } from '../models/Zone';

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
      this.discoverZoneCarbonDioxideSensors();
      this.discoverZoneCarbonMonoxideSensors();
      this.discoverZoneLeakSensors();
      this.discoverZoneOccupancySensors();
      this.discoverZoneTemperatureSensors();
      this.discoverZoneHumiditySensors();
      this.discoverBypassZoneSwitches();
      this.discoverButtonSwitches();
      this.discoverGarageDoors();
      this.discoverUnitSwitches();
      this.discoverUnitLightbulbs();
      this.discoverThermostats();
      this.discoverEmergencyAlarmSwitches();
      this.discoverAccessControls();
    } catch (error) {
      if (error instanceof Error) {
        this.platform.log.error(error.message);
      }
    }
  }

  discoverAreaSecuritySystems(): void {
    this.platform.log.debug(this.constructor.name, 'discoverAreaSecuritySystems');

    const areas = new Map<number, string>();

    if (this.platform.settings.includeAreas) {
      for(const [index, area] of this.platform.omniService.omni.areas.entries()) {
        if (this.platform.settings.exclude.areas.includes(index)) {
          continue;
        }
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
      for(const [index, zone] of this.platform.omniService.omni.zones.entries()) {
        if (this.isZoneOfAccessoryType(index, zone.type, 'motion')) {
          zones.set(index, zone.name);
        }
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
      for(const [index, zone] of this.platform.omniService.omni.zones.entries()) {
        if (this.isZoneOfAccessoryType(index, zone.type, 'smoke')) {
          zones.set(index, zone.name);
        }
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
      for(const [index, zone] of this.platform.omniService.omni.zones.entries()) {
        if (this.isZoneOfAccessoryType(index, zone.type, 'contact')) {
          zones.set(index, zone.name);
        }
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

  discoverZoneCarbonDioxideSensors(): void {
    this.platform.log.debug(this.constructor.name, 'discoverZoneCarbonDioxideSensors');

    const zones = new Map<number, string>();

    if (this.platform.settings.includeZones) {
      for(const [index, zone] of this.platform.omniService.omni.zones.entries()) {
        if (this.isZoneOfAccessoryType(index, zone.type, 'carbondioxide')) {
          zones.set(index, zone.name);
        }
      }
    }

    for(const [index, name] of zones) {
      this.addAccessory(CarbonDioxideSensor, CarbonDioxideSensor.type, name, index);
    }

    for(const accessory of this.accessories.values()) {
      if (accessory instanceof CarbonDioxideSensor) {
        if (!zones.has(accessory.platformAccessory.context.index)) {
          this.removeAccessory(CarbonDioxideSensor.type, accessory.platformAccessory.context.index);
        }
      }
    }
  }

  discoverZoneCarbonMonoxideSensors(): void {
    this.platform.log.debug(this.constructor.name, 'discoverZoneCarbonMonoxideSensors');

    const zones = new Map<number, string>();

    if (this.platform.settings.includeZones) {
      for(const [index, zone] of this.platform.omniService.omni.zones.entries()) {
        if (this.isZoneOfAccessoryType(index, zone.type, 'carbonmonoxide')) {
          zones.set(index, zone.name);
        }
      }
    }

    for(const [index, name] of zones) {
      this.addAccessory(CarbonMonoxideSensor, CarbonMonoxideSensor.type, name, index);
    }

    for(const accessory of this.accessories.values()) {
      if (accessory instanceof CarbonMonoxideSensor) {
        if (!zones.has(accessory.platformAccessory.context.index)) {
          this.removeAccessory(CarbonMonoxideSensor.type, accessory.platformAccessory.context.index);
        }
      }
    }
  }

  discoverZoneLeakSensors(): void {
    this.platform.log.debug(this.constructor.name, 'discoverZoneLeakSensors');

    const zones = new Map<number, string>();

    if (this.platform.settings.includeZones) {
      for(const [index, zone] of this.platform.omniService.omni.zones.entries()) {
        if (this.isZoneOfAccessoryType(index, zone.type, 'leak')) {
          zones.set(index, zone.name);
        }
      }
    }

    for(const [index, name] of zones) {
      this.addAccessory(LeakSensor, LeakSensor.type, name, index);
    }

    for(const accessory of this.accessories.values()) {
      if (accessory instanceof LeakSensor) {
        if (!zones.has(accessory.platformAccessory.context.index)) {
          this.removeAccessory(LeakSensor.type, accessory.platformAccessory.context.index);
        }
      }
    }
  }

  discoverZoneOccupancySensors(): void {
    this.platform.log.debug(this.constructor.name, 'discoverZoneOccupancySensors');

    const zones = new Map<number, string>();

    if (this.platform.settings.includeZones) {
      for(const [index, zone] of this.platform.omniService.omni.zones.entries()) {
        if (this.isZoneOfAccessoryType(index, zone.type, 'occupancy')) {
          zones.set(index, zone.name);
        }
      }
    }

    for(const [index, name] of zones) {
      this.addAccessory(OccupancySensor, OccupancySensor.type, name, index);
    }

    for(const accessory of this.accessories.values()) {
      if (accessory instanceof OccupancySensor) {
        if (!zones.has(accessory.platformAccessory.context.index)) {
          this.removeAccessory(OccupancySensor.type, accessory.platformAccessory.context.index);
        }
      }
    }
  }

  discoverZoneTemperatureSensors(): void {
    this.platform.log.debug(this.constructor.name, 'discoverZoneTemperatureSensors');

    const zones = new Map<number, string>();

    if (this.platform.settings.includeAuxiliarySensors) {
      for(const [index, zone] of this.platform.omniService.omni.zones.entries()) {
        if (this.platform.settings.exclude.auxiliarySensors.includes(index)) {
          continue;
        }
        if (zone.isAuxiliarySensor && zone.type !== ZoneTypes.Humidity) {
          zones.set(index, zone.name);
        }
      }
    }

    for(const [index, name] of zones) {
      this.addAccessory(TemperatureSensor, TemperatureSensor.type, name, index);
    }

    for(const accessory of this.accessories.values()) {
      if (accessory instanceof TemperatureSensor) {
        if (!zones.has(accessory.platformAccessory.context.index)) {
          this.removeAccessory(TemperatureSensor.type, accessory.platformAccessory.context.index);
        }
      }
    }
  }

  discoverZoneHumiditySensors(): void {
    this.platform.log.debug(this.constructor.name, 'discoverZoneHumiditySensors');

    const zones = new Map<number, string>();

    if (this.platform.settings.includeAuxiliarySensors) {
      for(const [index, zone] of this.platform.omniService.omni.zones.entries()) {
        if (this.platform.settings.exclude.auxiliarySensors.includes(index)) {
          continue;
        }
        if (zone.type === ZoneTypes.Humidity) {
          zones.set(index, zone.name);
        }
      }
    }

    for(const [index, name] of zones) {
      this.addAccessory(HumiditySensor, HumiditySensor.type, name, index);
    }

    for(const accessory of this.accessories.values()) {
      if (accessory instanceof HumiditySensor) {
        if (!zones.has(accessory.platformAccessory.context.index)) {
          this.removeAccessory(HumiditySensor.type, accessory.platformAccessory.context.index);
        }
      }
    }
  }

  private isZoneOfAccessoryType(index: number, zoneType: ZoneTypes, accessoryType: string): boolean {
    if (this.platform.settings.exclude.zones.includes(index)) {
      return false;
    }

    // Special handling for Auxiliary sensors
    if (this.platform.omniService.omni.zones[index].isAuxiliarySensor) {
      return false;
    }

    const sensorType = this.platform.settings.sensors.get(index);
    if (sensorType === undefined) {
      if (zoneType === ZoneTypes.FireEmergency) {
        if (this.platform.settings.defaultZoneFireEmergencyAccessoryType !== accessoryType) {
          return false;
        }
      } else {
        if (this.platform.settings.defaultZoneAccessoryType !== accessoryType) {
          return false;
        }
      }
    } else { 
      if (sensorType.toLowerCase() !== accessoryType) {
        return false;
      }
    }
    if (this.platform.settings.garageDoorZones.includes(index)) {
      return false;
    }
    return true;
  }

  discoverBypassZoneSwitches(): void {
    this.platform.log.debug(this.constructor.name, 'discoverBypassZoneSwitches');

    const sensorTypes = ['motion', 'smoke', 'contact', 'carbondioxide', 'carbonmonoxide', 'leak', 'occupancy'];
    const zones = new Map<number, string>();

    if (this.platform.settings.includeBypassZones) {
      for(const [index, zone] of this.platform.omniService.omni.zones.entries()) {
        if (this.platform.settings.exclude.zones.includes(index)) {
          continue;
        }
        const sensorType = this.platform.settings.sensors.get(index);
        if (sensorType !== undefined && !sensorTypes.includes(sensorType.toLowerCase())) {
          continue;
        }
        zones.set(index, `Bypass ${zone.name}`);
      }
    }

    for(const [index, name] of zones) {
      this.addAccessory(BypassZoneSwitch, BypassZoneSwitch.type, name, index);
    }

    for(const accessory of this.accessories.values()) {
      if (accessory instanceof BypassZoneSwitch) {
        if (!zones.has(accessory.platformAccessory.context.index)) {
          this.removeAccessory(BypassZoneSwitch.type, accessory.platformAccessory.context.index);
        }
      }
    }
  }

  discoverButtonSwitches(): void {
    this.platform.log.debug(this.constructor.name, 'discoverButtonSwitches');

    const buttons = new Map<number, string>();

    if (this.platform.settings.includeButtons) {
      for(const [index, button] of this.platform.omniService.omni.buttons.entries()) {
        if (this.platform.settings.garageDoors.has(index)) {
          continue;
        }
        if (this.platform.settings.exclude.buttons.includes(index)) {
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
      const button = this.platform.omniService.omni.buttons[buttonId];
      this.addAccessory(GarageDoorOpener, GarageDoorOpener.type, button.name, buttonId);
    }

    for(const accessory of this.accessories.values()) {
      if (accessory instanceof GarageDoorOpener) {
        if (!this.platform.settings.garageDoors.has(accessory.platformAccessory.context.index)) {
          this.removeAccessory(GarageDoorOpener.type, accessory.platformAccessory.context.index);
        }
      }
    }
  }

  discoverUnitSwitches(): void {
    this.platform.log.debug(this.constructor.name, 'discoverUnitSwitches');

    const units = new Map<number, string>();

    if (this.platform.settings.includeUnits) {
      for(const [index, unit] of this.platform.omniService.omni.units.entries()) {
        if (this.isUnitOfAccessoryType(index, 'switch')) {
          units.set(index, unit.name);
        }
      }
    }

    for(const [index, name] of units) {
      this.addAccessory(UnitSwitch, UnitSwitch.type, name, index);
    }

    for(const accessory of this.accessories.values()) {
      if (accessory instanceof UnitSwitch) {
        if (!units.has(accessory.platformAccessory.context.index)) {
          this.removeAccessory(UnitSwitch.type, accessory.platformAccessory.context.index);
        }
      }
    }
  }

  discoverUnitLightbulbs(): void {
    this.platform.log.debug(this.constructor.name, 'discoverUnitLightbulbs');

    const units = new Map<number, string>();

    if (this.platform.settings.includeUnits) {
      for(const [index, unit] of this.platform.omniService.omni.units.entries()) {
        if (this.isUnitOfAccessoryType(index, 'lightbulb')) {
          units.set(index, unit.name);
        }
      }
    }

    for(const [index, name] of units) {
      this.addAccessory(UnitLightbulb, UnitLightbulb.type, name, index);
    }

    for(const accessory of this.accessories.values()) {
      if (accessory instanceof UnitLightbulb) {
        if (!units.has(accessory.platformAccessory.context.index)) {
          this.removeAccessory(UnitLightbulb.type, accessory.platformAccessory.context.index);
        }
      }
    }
  }

  private isUnitOfAccessoryType(index: number, accessoryType: string): boolean {
    if (this.platform.settings.exclude.units.includes(index)) {
      return false;
    }

    const unitAccessoryType = this.platform.settings.units.get(index);
    if (unitAccessoryType === undefined) {
      if (this.platform.settings.defaultUnitAccessoryType !== accessoryType) {
        return false;
      }
    } else {
      if (unitAccessoryType.toLowerCase() !== accessoryType) {
        return false;
      }
    }
    return true;
  }

  discoverThermostats(): void {
    this.platform.log.debug(this.constructor.name, 'discoverThermostats');

    const thermostats = new Map<number, string>();

    if (this.platform.settings.includeThermostats) {
      for(const [index, thermostat] of this.platform.omniService.omni.thermostats.entries()) {
        if (this.platform.settings.exclude.thermostats.includes(index)) {
          continue;
        }
        thermostats.set(index, thermostat.name);
      }
    }

    for(const [index, name] of thermostats) {
      this.addAccessory(Thermostat, Thermostat.type, name, index);
    }

    for(const accessory of this.accessories.values()) {
      if (accessory instanceof Thermostat) {
        if (!thermostats.has(accessory.platformAccessory.context.index)) {
          this.removeAccessory(Thermostat.type, accessory.platformAccessory.context.index);
        }
      }
    }
  }

  discoverEmergencyAlarmSwitches(): void {
    this.platform.log.debug(this.constructor.name, 'discoverEmergencyAlarmSwitches');

    const areaEmergencies = new Map<number, string>();

    if (this.platform.settings.includeEmergencyAlarms) {
      for(const [areaId, area] of this.platform.omniService.omni.areas.entries()) {
        for (const emegencyType in EmergencyTypes) {
          if (!isNaN(Number(emegencyType))) {
            const index = areaId * 256 + Number(emegencyType);
            areaEmergencies.set(index, `${area.name} ${EmergencyTypes[emegencyType]}`);
          }
        }
      }
    }

    for(const [index, name] of areaEmergencies) {
      this.addAccessory(EmergencyAlarmSwitch, EmergencyAlarmSwitch.type, name, index);
    }

    for(const accessory of this.accessories.values()) {
      if (accessory instanceof EmergencyAlarmSwitch) {
        if (!areaEmergencies.has(accessory.platformAccessory.context.index)) {
          this.removeAccessory(EmergencyAlarmSwitch.type, accessory.platformAccessory.context.index);
        }
      }
    }
  }

  discoverAccessControls(): void {
    this.platform.log.debug(this.constructor.name, 'discoverAccessControls');

    const accessControls = new Map<number, string>();

    if (this.platform.settings.includeAccessControls) {
      for(const [index, accessControl] of this.platform.omniService.omni.accessControls.entries()) {
        if (this.platform.settings.exclude.accessControls.includes(index)) {
          continue;
        }
        accessControls.set(index, accessControl.name);
      }
    }

    for(const [index, name] of accessControls) {
      this.addAccessory(LockMechanism, LockMechanism.type, name, index);
    }

    for(const accessory of this.accessories.values()) {
      if (accessory instanceof LockMechanism) {
        if (!accessControls.has(accessory.platformAccessory.context.index)) {
          this.removeAccessory(LockMechanism.type, accessory.platformAccessory.context.index);
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
      case 'carbondioxidesensor':
        return new CarbonDioxideSensor(this.platform, platformAccessory);
      case 'carbonmonoxidesensor':
        return new CarbonMonoxideSensor(this.platform, platformAccessory);
      case 'leaksensor':
        return new LeakSensor(this.platform, platformAccessory);
      case 'occupancysensor':
        return new OccupancySensor(this.platform, platformAccessory);
      case 'bypasszoneswitch':
        return new BypassZoneSwitch(this.platform, platformAccessory);
      case 'garagedooropener':
        return new GarageDoorOpener(this.platform, platformAccessory);
      case 'unitswitch':
        return new UnitSwitch(this.platform, platformAccessory);
      case 'unitlightbulb':
        return new UnitLightbulb(this.platform, platformAccessory);
      case 'thermostat':
        return new Thermostat(this.platform, platformAccessory);
      case 'emergencyalarm':
        return new EmergencyAlarmSwitch(this.platform, platformAccessory);
      case 'lockmechanism':
        return new LockMechanism(this.platform, platformAccessory);
      case 'temperaturesensor':
        return new TemperatureSensor(this.platform, platformAccessory);
      case 'humiditysensor':
        return new HumiditySensor(this.platform, platformAccessory);
    }
  }

  getKey(type: string, index?: number): string {
    this.platform.log.debug(this.constructor.name, 'getKey', type, index);

    return index ? `${type}_${index}` : type;
  }
}