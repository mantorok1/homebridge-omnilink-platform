import type { API, Characteristic, DynamicPlatformPlugin, Logger, MatterAccessory, PlatformAccessory, PlatformConfig, Service } from 'homebridge'

import type { Devices } from './omni/OmniService.js'

import { promises as fs } from 'node:fs'
import path from 'node:path'

import { HomekitAccessoryService } from './accessories/homekit/HomekitAccessoryService.js'
import { MatterAccessoryService } from './accessories/matter/MatterAccessoryService.js'
import { AuxiliarySensorTypes } from './models/AuxiliarySensor.js'
import { Settings } from './models/Settings.js'
import { ThermostatTypes } from './models/Thermostat.js'
import { UnitTypes } from './models/Unit.js'
import { ZoneTypes } from './models/Zone.js'
import { OmniService } from './omni/OmniService.js'
import { MqttService } from './services/MqttService.js'
import { PushoverService } from './services/PushoverService.js'
import { PLATFORM_NAME, PLUGIN_NAME } from './settings.js'

export class OmniLinkPlatform implements DynamicPlatformPlugin {
  public readonly Service: typeof Service
  public readonly Characteristic: typeof Characteristic

  private deletedHomekitAccessories: PlatformAccessory[] = []
  private deletedMatterAccessories: MatterAccessory[] = []

  public readonly settings!: Settings
  public readonly omniService!: OmniService
  public readonly homekitAccessoryService!: HomekitAccessoryService
  public readonly matterAccessoryService!: MatterAccessoryService
  public readonly pushoverService!: PushoverService
  public readonly mqttService!: MqttService
  private _serviceInitialised = false
  private _serviceInitialising = false
  private _cacheFile = ''

  constructor(
    public readonly log: Logger,
    public readonly config: PlatformConfig,
    public readonly api: API,
  ) {
    this.Service = this.api.hap.Service
    this.Characteristic = this.api.hap.Characteristic

    try {
      this.log.debug('Finished initializing platform:', this.config.name)

      this.settings = new Settings(config)
      this.omniService = new OmniService(this)
      this.homekitAccessoryService = new HomekitAccessoryService(this)
      this.matterAccessoryService = new MatterAccessoryService(this)
      this.pushoverService = new PushoverService(this)
      this.mqttService = new MqttService(this)
      this._cacheFile = path.join(this.api.user.storagePath(), 'OmnilinkPlatform', `${this.settings.name}.json`)

      this.api.on('didFinishLaunching', () => {
        this.log.debug('Finished launching plugin')
        this.discoverDevices()
      })

      this.api.on('shutdown', () => {
        this.log.debug('Shutting down plugin')
        this.omniService.terminate()
      })
    } catch (error) {
      if (error instanceof Error) {
        this.log.error(error.message)
      }
    }
  }

  async configureAccessory(platformAccessory: PlatformAccessory) {
    this.log.debug(this.constructor.name, 'configureAccessory')

    try {
      if (this.settings.clearCache) {
        this.deletedHomekitAccessories.push(platformAccessory)
        return
      }

      await this.initOmniService()

      this.homekitAccessoryService.configure(platformAccessory)
    } catch (error) {
      if (error instanceof Error) {
        this.log.error(`Failed to configure accessory ${platformAccessory.displayName}: ${error.message}`)
      }
    }
  }

  async configureMatterAccessory(accessory: MatterAccessory) {
    this.log.debug(this.constructor.name, 'configureMatterAccessory')

    try {
      if (this.settings.clearCache) {
        this.deletedMatterAccessories.push(accessory)
        return
      }

      await this.initOmniService()

      await this.matterAccessoryService.configure(accessory)
    } catch (error) {
      if (error instanceof Error) {
        this.log.error(`Failed to configure accessory ${accessory.displayName}: ${error.message}`)
      }
    }
  }

  private async initOmniService(): Promise<void> {
    this.log.debug(this.constructor.name, 'initOmniService')

    return new Promise((resolve, reject) => {
      (async () => {
        if (this._serviceInitialised) {
          resolve()
        }

        this.omniService.once('initialised', () => {
          this._serviceInitialised = true
          this._serviceInitialising = false
          resolve()
        })

        if (!this._serviceInitialising) {
          try {
            this._serviceInitialising = true
            await this.omniService.init()
            const devices = await this.readCache()
            await this.omniService.discover(devices)
            await this.writeCache(devices)
            this.omniService.initialised()
          } catch (error) {
            if (error instanceof Error) {
              this.log.error(`Init Omni Service failed: ${error.message}`)
            }
            reject(error)
          }
        }
      })()
    })
  }

  async discoverDevices(): Promise<void> {
    try {
      this.log.debug(this.constructor.name, 'discoverDevices')

      if (!this.settings.isValid) {
        this.log.warn('Cannot start plugin as settings are invalid')
        return
      }

      // Clear cached accessories if required
      if (this.settings.clearCache) {
        this.log.info('Clear Cached Accessories')
        this.api.unregisterPlatformAccessories(PLUGIN_NAME, PLATFORM_NAME, this.deletedHomekitAccessories)

        await this.api.matter?.unregisterPlatformAccessories(PLUGIN_NAME, PLATFORM_NAME, this.deletedMatterAccessories)

        this.deletedHomekitAccessories = []
        this.deletedMatterAccessories = []
      }

      await this.initOmniService()
      this.displayDevices()

      // Add/Remove HAP accessories
      this.homekitAccessoryService.discover()

      // Add/Remove Matter accessories
      await this.matterAccessoryService.discover()

      // Initialise Pushover notifications
      this.pushoverService.init()

      // Initialise MQTT
      this.mqttService.init()
    } catch (error) {
      if (error instanceof Error) {
        this.log.error(`Failed to discover devices: ${error.message}`)
      }
    }
  }

  private displayDevices(): void {
    this.log.debug(this.constructor.name, 'displayDevices')

    const omni = this.omniService.omni

    this.log.info(`Found: ${omni.information.model} [Firmware version: ${omni.information.version}]`)

    // Display found devices
    this.log.info('Areas found:', omni.areas.length)
    for (const [index, area] of omni.areas.entries()) {
      this.log.info(`  ${String(index).padStart(3)}: ${area.name}`)
    }

    this.log.info('Zones found:', omni.zones.length)
    for (const [index, zone] of omni.zones.entries()) {
      this.log.info(`  ${String(index).padStart(3)}: ${zone.name.padEnd(17)} [${ZoneTypes[zone.type]}]`)
    }

    this.log.info('Units found:', omni.units.length)
    for (const [index, unit] of omni.units.entries()) {
      this.log.info(`  ${String(index).padStart(3)}: ${unit.name.padEnd(17)} [${UnitTypes[unit.type]}]`)
    }

    this.log.info('Buttons found:', omni.buttons.length)
    for (const [index, button] of omni.buttons.entries()) {
      this.log.info(`  ${String(index).padStart(3)}: ${button.name}`)
    }

    this.log.info('Thermostats found:', this.omniService.omni.thermostats.length)
    for (const [index, thermostat] of this.omniService.omni.thermostats.entries()) {
      this.log.info(`  ${String(index).padStart(3)}: ${thermostat.name.padEnd(17)} [${ThermostatTypes[thermostat.type]}]`)
    }

    this.log.info('Access Controls found:', this.omniService.omni.accessControls.length)
    for (const [index, accessControl] of this.omniService.omni.accessControls.entries()) {
      this.log.info(`  ${String(index).padStart(3)}: ${accessControl.name}`)
    }

    this.log.info('Auxiliary Sensors found:', omni.sensors.length)
    for (const [index, sensor] of omni.sensors.entries()) {
      this.log.info(`  ${String(index).padStart(3)}: ${sensor.name.padEnd(17)} [${AuxiliarySensorTypes[sensor.type]}]`)
    }

    this.log.info('Audio Sources found:', omni.audioSources.length)
    for (const [index, audioSource] of omni.audioSources.entries()) {
      this.log.info(`  ${String(index).padStart(3)}: ${audioSource.name}`)
    }

    this.log.info('Audio Zones found:', omni.audioZones.length)
    for (const [index, audioZones] of omni.audioZones.entries()) {
      this.log.info(`  ${String(index).padStart(3)}: ${audioZones.name}`)
    }
  }

  private async readCache(): Promise<Devices | undefined> {
    this.log.debug(this.constructor.name, 'readCache')

    if (this.settings.forceAutoDiscovery) {
      this.log.info('Forcing Auto-Discovery')
      return
    }

    let devices: Devices

    try {
      const content = await fs.readFile(this._cacheFile, { encoding: 'utf8' })
      this.log.info(`Read config from cache [${this._cacheFile}]`)
      devices = JSON.parse(content)
    } catch {
      this.log.info('Performing Auto-Discovery')
      return
    }

    return devices
  }

  private async writeCache(devices?: Devices): Promise<void> {
    this.log.debug(this.constructor.name, 'writeCache', devices)

    devices = {
      areas: [...this.omniService.omni.areas.keys()],
      zones: [...this.omniService.omni.zones.keys()],
      units: [...this.omniService.omni.units.keys()],
      buttons: [...this.omniService.omni.buttons.keys()],
      thermostats: [...this.omniService.omni.thermostats.keys()],
      codes: [...this.omniService.omni.codes.keys()],
      audioSources: [...this.omniService.omni.audioSources.keys()],
      audioZones: [...this.omniService.omni.audioZones.keys()],
      accessControls: [...this.omniService.omni.accessControls.keys()],
    }

    try {
      this.log.info(`Writing config to cache [${this._cacheFile}]`)
      const content = JSON.stringify(devices)
      await fs.mkdir(path.dirname(this._cacheFile), { recursive: true })
      await fs.writeFile(this._cacheFile, content, { encoding: 'utf8' })

      // Remove the old config file if it exists
      try {
        await fs.unlink(path.join(this.api.user.storagePath(), 'OmnilinkPlatform.json'))
      } catch {
        // do nothing
      }
    } catch (error) {
      if (error instanceof Error) {
        this.log.warn(`Writing config failed [${error.message}]`)
      }
    }
  }
}
