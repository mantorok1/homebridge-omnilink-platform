import type { MatterAccessory } from 'homebridge'

import type { OmniLinkPlatform } from '../../platform.js'
import type { MatterAccessoryBase } from './MatterAccessoryBase.js'

import { ZoneTypes } from '../../models/Zone.js'
import { EmergencyTypes } from '../../omni/messages/enums.js'
import { PLATFORM_NAME, PLUGIN_NAME } from '../../settings.js'
import { ButtonSwitch } from './ButtonSwitch.js'
import { BypassZoneSwitch } from './BypassZoneSwitch.js'
import { ContactSensor } from './ContactSensor.js'
import { DoorLock } from './DoorLock.js'
import { EmergencyAlarmSwitch } from './EmergencyAlarmSwitch.js'
import { HumiditySensor } from './HumiditySensor.js'
import { LeakSensor } from './LeakSensor.js'
import { MotionSensor } from './MotionSensor.js'
import { SmokeSensor } from './SmokeSensor.js'
import { TemperatureSensor } from './TemperatureSensor.js'
import { Thermostat } from './Thermostat.js'
import { UnitDimmableLight } from './UnitDimmableLight.js'
import { UnitSwitch } from './UnitSwitch.js'
import { UnitWindowCovering } from './UnitWindowCovering.js'

export class MatterAccessoryService {
  private previousAccessories: Map<string, MatterAccessory> = new Map()
  private currentAccessories: Map<string, MatterAccessory> = new Map()

  constructor(
    private readonly platform: OmniLinkPlatform,
  ) { }

  async discover(): Promise<void> {
    this.platform.log.debug(this.constructor.name, 'discover')

    if (!(this.platform.api.isMatterAvailable?.() && this.platform.api.isMatterEnabled?.())) {
      this.platform.log.warn('Matter is not available or enabled. Skipping Matter accessory discovery.')
      return
    }

    try {
      await this.discoverZoneMotionSensors()
      await this.discoverZoneSmokeSensors()
      await this.discoverZoneContactSensors()
      await this.discoverZoneLeakSensors()
      await this.discoverZoneTemperatureSensors()
      await this.discoverZoneHumiditySensors()
      await this.discoverBypassZoneSwitches()
      await this.discoverButtonSwitches()
      await this.discoverUnitSwitches()
      await this.discoverUnitDimmableLights()
      await this.discoverUnitWindowCoverings()
      await this.discoverThermostats()
      await this.discoverEmergencyAlarmSwitches()
      await this.discoverAccessControls()

      const accessories = [...this.currentAccessories.values()]
      if (accessories.length > 0) {
        this.platform.log.info(`Registering ${this.currentAccessories.size} Matter accessories with Homebridge`)
        for (const accessory of accessories) {
          this.platform.log.info(` - ${accessory.deviceType.name}: ${accessory.displayName}`)
        }
        await this.platform.api.matter!.registerPlatformAccessories(PLUGIN_NAME, PLATFORM_NAME, accessories)
      }

      const removedAccessories = [...this.previousAccessories.values()]
        .filter(a => !this.currentAccessories.has(a.context.key as string))
      if (removedAccessories.length > 0) {
        this.platform.log.info(`Unregistering ${removedAccessories.length} Matter accessories from Homebridge`)
        for (const accessory of removedAccessories) {
          this.platform.log.info(` - ${accessory.deviceType.name}: ${accessory.displayName}`)
        }
        await this.platform.api.matter!.unregisterPlatformAccessories(PLUGIN_NAME, PLATFORM_NAME, removedAccessories)
      }
    } catch (error) {
      if (error instanceof Error) {
        this.platform.log.error(error.message)
      }
    }
  }

  async discoverZoneMotionSensors(): Promise<void> {
    this.platform.log.debug(this.constructor.name, 'discoverZoneMotionSensors')

    const zones = new Map<number, string>()

    if (this.platform.settings.includeZones) {
      for (const [index, zone] of this.platform.omniService.omni.zones.entries()) {
        if (this.isZoneOfAccessoryType(index, zone.type, ['motion', 'occupancy'])) {
          zones.set(index, zone.name)
        }
      }
    }

    for (const [index, name] of zones) {
      await this.addMatterAccessory(MotionSensor, MotionSensor.type, name, index)
    }
  }

  async discoverZoneSmokeSensors(): Promise<void> {
    this.platform.log.debug(this.constructor.name, 'discoverZoneSmokeSensors')

    const zones = new Map<number, string>()

    if (this.platform.settings.includeZones) {
      for (const [index, zone] of this.platform.omniService.omni.zones.entries()) {
        if (this.isZoneOfAccessoryType(index, zone.type, ['smoke', 'carbondioxide', 'carbonmonoxide'])) {
          zones.set(index, zone.name)
        }
      }
    }

    for (const [index, name] of zones) {
      await this.addMatterAccessory(SmokeSensor, SmokeSensor.type, name, index)
    }
  }

  async discoverZoneContactSensors(): Promise<void> {
    this.platform.log.debug(this.constructor.name, 'discoverZoneContactSensors')

    const zones = new Map<number, string>()

    if (this.platform.settings.includeZones) {
      for (const [index, zone] of this.platform.omniService.omni.zones.entries()) {
        if (this.isZoneOfAccessoryType(index, zone.type, 'contact')) {
          zones.set(index, zone.name)
        }
      }
    }

    for (const [index, name] of zones) {
      await this.addMatterAccessory(ContactSensor, ContactSensor.type, name, index)
    }
  }

  async discoverZoneLeakSensors(): Promise<void> {
    this.platform.log.debug(this.constructor.name, 'discoverZoneLeakSensors')

    const zones = new Map<number, string>()

    if (this.platform.settings.includeZones) {
      for (const [index, zone] of this.platform.omniService.omni.zones.entries()) {
        if (this.isZoneOfAccessoryType(index, zone.type, 'leak')) {
          zones.set(index, zone.name)
        }
      }
    }

    for (const [index, name] of zones) {
      await this.addMatterAccessory(LeakSensor, LeakSensor.type, name, index)
    }
  }

  async discoverZoneTemperatureSensors(): Promise<void> {
    this.platform.log.debug(this.constructor.name, 'discoverZoneTemperatureSensors')

    const zones = new Map<number, string>()

    if (this.platform.settings.includeAuxiliarySensors) {
      for (const [index, zone] of this.platform.omniService.omni.zones.entries()) {
        if (this.platform.settings.exclude.auxiliarySensors.includes(index)) {
          continue
        }
        if (zone.isAuxiliarySensor && zone.type !== ZoneTypes.Humidity) {
          zones.set(index, zone.name)
        }
      }
    }

    for (const [index, name] of zones) {
      await this.addMatterAccessory(TemperatureSensor, TemperatureSensor.type, name, index)
    }
  }

  async discoverZoneHumiditySensors(): Promise<void> {
    this.platform.log.debug(this.constructor.name, 'discoverZoneHumiditySensors')

    const zones = new Map<number, string>()

    if (this.platform.settings.includeAuxiliarySensors) {
      for (const [index, zone] of this.platform.omniService.omni.zones.entries()) {
        if (this.platform.settings.exclude.auxiliarySensors.includes(index)) {
          continue
        }
        if (zone.type === ZoneTypes.Humidity) {
          zones.set(index, zone.name)
        }
      }
    }

    for (const [index, name] of zones) {
      await this.addMatterAccessory(HumiditySensor, HumiditySensor.type, name, index)
    }
  }

  async discoverBypassZoneSwitches(): Promise<void> {
    this.platform.log.debug(this.constructor.name, 'discoverBypassZoneSwitches')

    const sensorTypes = ['motion', 'smoke', 'contact', 'carbondioxide', 'carbonmonoxide', 'leak', 'occupancy']
    const zones = new Map<number, string>()

    if (this.platform.settings.includeBypassZones) {
      for (const [index, zone] of this.platform.omniService.omni.zones.entries()) {
        if (this.platform.settings.exclude.zones.includes(index)) {
          continue
        }
        const sensorType = this.platform.settings.sensors.get(index)
        if (sensorType !== undefined && !sensorTypes.includes(sensorType.toLowerCase())) {
          continue
        }
        zones.set(index, `Bypass ${zone.name}`)
      }
    }

    for (const [index, name] of zones) {
      await this.addMatterAccessory(BypassZoneSwitch, BypassZoneSwitch.type, name, index)
    }
  }

  async discoverButtonSwitches(): Promise<void> {
    this.platform.log.debug(this.constructor.name, 'discoverButtonSwitches')

    const buttons = new Map<number, string>()

    if (this.platform.settings.includeButtons) {
      for (const [index, button] of this.platform.omniService.omni.buttons.entries()) {
        if (this.platform.settings.garageDoors.has(index)) {
          continue
        }
        if (this.platform.settings.exclude.buttons.includes(index)) {
          continue
        }
        buttons.set(index, button.name)
      }
    }

    for (const [index, name] of buttons) {
      await this.addMatterAccessory(ButtonSwitch, ButtonSwitch.type, name, index)
    }
  }

  async discoverUnitSwitches(): Promise<void> {
    this.platform.log.debug(this.constructor.name, 'discoverUnitSwitches')

    const units = new Map<number, string>()

    if (this.platform.settings.includeUnits) {
      for (const [index, unit] of this.platform.omniService.omni.units.entries()) {
        if (this.isUnitOfAccessoryType(index, 'switch')) {
          units.set(index, unit.name)
        }
      }
    }

    for (const [index, name] of units) {
      this.addMatterAccessory(UnitSwitch, UnitSwitch.type, name, index)
    }
  }

  async discoverUnitDimmableLights(): Promise<void> {
    this.platform.log.debug(this.constructor.name, 'discoverUnitDimmableLights')

    const units = new Map<number, string>()

    if (this.platform.settings.includeUnits) {
      for (const [index, unit] of this.platform.omniService.omni.units.entries()) {
        if (this.isUnitOfAccessoryType(index, 'lightbulb')) {
          units.set(index, unit.name)
        }
      }
    }

    for (const [index, name] of units) {
      await this.addMatterAccessory(UnitDimmableLight, UnitDimmableLight.type, name, index)
    }
  }

  async discoverUnitWindowCoverings(): Promise<void> {
    this.platform.log.debug(this.constructor.name, 'discoverUnitWindowCoverings')

    const units = new Map<number, string>()

    if (this.platform.settings.includeUnits) {
      for (const [index, unit] of this.platform.omniService.omni.units.entries()) {
        if (this.isUnitOfAccessoryType(index, 'windowcovering')) {
          units.set(index, unit.name)
        }
      }
    }

    for (const [index, name] of units) {
      await this.addMatterAccessory(UnitWindowCovering, UnitWindowCovering.type, name, index)
    }
  }

  async discoverThermostats(): Promise<void> {
    this.platform.log.debug(this.constructor.name, 'discoverThermostats')

    const thermostats = new Map<number, string>()

    if (this.platform.settings.includeThermostats) {
      for (const [index, thermostat] of this.platform.omniService.omni.thermostats.entries()) {
        if (this.platform.settings.exclude.thermostats.includes(index)) {
          continue
        }
        thermostats.set(index, thermostat.name)
      }
    }

    for (const [index, name] of thermostats) {
      await this.addMatterAccessory(Thermostat, Thermostat.type, name, index)
    }
  }

  async discoverEmergencyAlarmSwitches(): Promise<void> {
    this.platform.log.debug(this.constructor.name, 'discoverEmergencyAlarmSwitches')

    const areaEmergencies = new Map<number, string>()

    if (this.platform.settings.includeEmergencyAlarms) {
      for (const [areaId, area] of this.platform.omniService.omni.areas.entries()) {
        for (const emegencyType in EmergencyTypes) {
          if (!Number.isNaN(Number(emegencyType))) {
            const index = areaId * 256 + Number(emegencyType)
            areaEmergencies.set(index, `${area.name} ${EmergencyTypes[emegencyType]}`)
          }
        }
      }
    }

    for (const [index, name] of areaEmergencies) {
      await this.addMatterAccessory(EmergencyAlarmSwitch, EmergencyAlarmSwitch.type, name, index)
    }
  }

  async discoverAccessControls(): Promise<void> {
    this.platform.log.debug(this.constructor.name, 'discoverAccessControls')

    const accessControls = new Map<number, string>()

    if (this.platform.settings.includeAccessControls) {
      for (const [index, accessControl] of this.platform.omniService.omni.accessControls.entries()) {
        if (this.platform.settings.exclude.accessControls.includes(index)) {
          continue
        }
        accessControls.set(index, accessControl.name)
      }
    }

    for (const [index, name] of accessControls) {
      await this.addMatterAccessory(DoorLock, DoorLock.type, name, index)
    }
  }

  private isZoneOfAccessoryType(index: number, zoneType: ZoneTypes, accessoryType: string | string[]): boolean {
    const matches = (type: string): boolean =>
      Array.isArray(accessoryType) ? accessoryType.includes(type) : accessoryType === type

    if (this.platform.settings.exclude.zones.includes(index)) {
      return false
    }

    // Special handling for Auxiliary sensors
    if (this.platform.omniService.omni.zones[index].isAuxiliarySensor) {
      return false
    }

    const sensorType = this.platform.settings.sensors.get(index)
    if (sensorType === undefined) {
      if (zoneType === ZoneTypes.FireEmergency) {
        if (!matches(this.platform.settings.defaultZoneFireEmergencyAccessoryType)) {
          return false
        }
      } else {
        if (!matches(this.platform.settings.defaultZoneAccessoryType)) {
          return false
        }
      }
    } else {
      if (!matches(sensorType.toLowerCase())) {
        return false
      }
    }
    if (this.platform.settings.garageDoorZones.includes(index)) {
      return false
    }
    return true
  }

  private isUnitOfAccessoryType(index: number, accessoryType: string): boolean {
    if (this.platform.settings.exclude.units.includes(index)) {
      return false
    }

    const unitAccessoryType = this.platform.settings.units.get(index)
    if (unitAccessoryType === undefined) {
      if (this.platform.settings.defaultUnitAccessoryType !== accessoryType) {
        return false
      }
    } else {
      if (unitAccessoryType.toLowerCase() !== accessoryType) {
        return false
      }
    }
    return true
  }

  async addMatterAccessory<TAccessory extends MatterAccessoryBase>(
    Accessory: new (platform: OmniLinkPlatform, type: string, name: string, index?: number) => TAccessory,
    type: string,
    name: string,
    index?: number,
  ): Promise<void> {
    this.platform.log.debug(this.constructor.name, 'addMatterAccessory', 'Accessory', type, name, index)

    const key: string = this.getKey(type, index)
    const accessory = new Accessory(this.platform, name, key, index)
    this.currentAccessories.set(key, accessory)
  }

  // Called from configureAccessory
  async configure(accessory: MatterAccessory): Promise<void> {
    this.platform.log.debug(this.constructor.name, 'configure', 'accessory')

    this.previousAccessories.set(accessory.context.key, accessory)
  }

  getKey(type: string, index?: number): string {
    this.platform.log.debug(this.constructor.name, 'getKey', type, index)

    return index ? `${type}_${index}` : type
  }
}
