import { API, DynamicPlatformPlugin, Logger, PlatformAccessory, PlatformConfig, Service, Characteristic } from 'homebridge';
import { PLATFORM_NAME, PLUGIN_NAME } from './settings';
import { Settings } from './models/Settings';
import { OmniService, Devices } from './omni/OmniService';
import { AccessoryService } from './accessories/AccessoryService';
import { PushoverService } from './services/PushoverService';
import { MqttService } from './services/MqttService';
import { ZoneTypes } from './models/Zone';
import { UnitTypes } from './models/Unit';
import { ThermostatTypes } from './models/Thermostat';
import { AuxiliarySensorTypes } from './models/AuxiliarySensor';
import fs = require('fs');
import path = require('path');

export class OmniLinkPlatform implements DynamicPlatformPlugin {
  public readonly Service: typeof Service = this.api.hap.Service;
  public readonly Characteristic: typeof Characteristic = this.api.hap.Characteristic;

  private deletedAccessories: PlatformAccessory[] = [];

  public readonly settings!: Settings;
  public readonly omniService!: OmniService;
  public readonly accessoryService!: AccessoryService;
  public readonly pushoverService!: PushoverService;
  public readonly mqttService!: MqttService;
  private _serviceInitialised = false;
  private _serviceInitialising = false;
  private _cacheFile = '';

  constructor(
    public readonly log: Logger,
    public readonly config: PlatformConfig,
    public readonly api: API,
  ) {
    try {
      this.log.debug('Finished initializing platform:', this.config.name);

      this.settings = new Settings(config);
      this.omniService = new OmniService(this);
      this.accessoryService = new AccessoryService(this);
      this.pushoverService = new PushoverService(this);
      this.mqttService = new MqttService(this);
      this._cacheFile = path.join(this.api.user.storagePath(), 'OmnilinkPlatform', `${this.settings.name}.json`);

      this.api.on('didFinishLaunching', () => {
        this.log.debug('Finished launching plugin');
        this.discoverDevices();
      });

      this.api.on('shutdown', () => {
        this.log.debug('Shutting down plugin');
        this.omniService.terminate();
      });
    } catch(error) {
      if (error instanceof Error) {
        this.log.error(error.message);
      }
    }
  }

  async configureAccessory(platformAccessory: PlatformAccessory) {
    this.log.debug(this.constructor.name, 'configureAccessory');

    try {
      if (this.settings.clearCache) {
        this.deletedAccessories.push(platformAccessory);
        return;
      }

      await this.initOmniService();

      this.accessoryService.configure(platformAccessory);
    } catch(error) {
      if (error instanceof Error) {
        this.log.error(`Failed to configure accessory ${platformAccessory.displayName}: ${error.message}`);
      }
    }
  }

  private async initOmniService(): Promise<void> {
    this.log.debug(this.constructor.name, 'initOmniService');

    return new Promise((resolve, reject) => {
      (async() => {
        if (this._serviceInitialised) {
          resolve();
        }
  
        this.omniService.once('initialised', () => {
          this._serviceInitialised = true;
          this._serviceInitialising = false;
          resolve();
        });
  
        if (!this._serviceInitialising) {
          try {
            this._serviceInitialising = true;
            await this.omniService.init(); 
            const devices = await this.readCache();
            await this.omniService.discover(devices);
            await this.writeCache(devices);
            this.omniService.initialised();
          } catch(error) {
            if (error instanceof Error) {
              this.log.error(`Init Omni Service failed: ${error.message}`);
            }
            reject(error);
          }
        }
      })();
    });
  }

  async discoverDevices(): Promise<void> {
    try {
      this.log.debug(this.constructor.name, 'discoverDevices');

      if (!this.settings.isValid) {
        this.log.warn('Cannot start plugin as settings are invalid');
        return;
      }

      // Clear cached accessories if required
      if (this.settings.clearCache) {
        this.log.info('Clear Cached Accessories');
        this.api.unregisterPlatformAccessories(PLUGIN_NAME, PLATFORM_NAME, this.deletedAccessories);
        this.deletedAccessories = [];
      }

      await this.initOmniService();
      this.displayDevices();

      // Add/Remove accessories
      this.accessoryService.discover();

      // Initialise Pushover notifications
      this.pushoverService.init();

      // Initialise MQTT
      this.mqttService.init();

    } catch (error) {
      if (error instanceof Error) {
        this.log.error(`Failed to discover devices: ${error.message}`);
      }
    }
  }

  private displayDevices(): void {
    this.log.debug(this.constructor.name, 'displayDevices');

    const omni = this.omniService.omni;

    this.log.info(`Found: ${omni.information.model} [Firmware version: ${omni.information.version}]`);

    // Display found devices
    this.log.info('Areas found:', omni.areas.length);
    for (const [index, area] of omni.areas.entries()) {
      this.log.info(`  ${String(index).padStart(3)}: ${area.name}`);
    }

    this.log.info('Zones found:', omni.zones.length);
    for (const [index, zone] of omni.zones.entries()) {
      this.log.info(`  ${String(index).padStart(3)}: ${zone.name.padEnd(17)} [${ZoneTypes[zone.type]}]`);
    }

    this.log.info('Units found:', omni.units.length);
    for (const [index, unit] of omni.units.entries()) {
      this.log.info(`  ${String(index).padStart(3)}: ${unit.name.padEnd(17)} [${UnitTypes[unit.type]}]`);
    }

    this.log.info('Buttons found:', omni.buttons.length);
    for (const [index, button] of omni.buttons.entries()) {
      this.log.info(`  ${String(index).padStart(3)}: ${button.name}`);
    }

    this.log.info('Thermostats found:', this.omniService.omni.thermostats.length);
    for (const [index, thermostat] of this.omniService.omni.thermostats.entries()) {
      this.log.info(`  ${String(index).padStart(3)}: ${thermostat.name.padEnd(17)} [${ThermostatTypes[thermostat.type]}]`);
    }

    this.log.info('Access Controls found:', this.omniService.omni.accessControls.length);
    for (const [index, accessControl] of this.omniService.omni.accessControls.entries()) {
      this.log.info(`  ${String(index).padStart(3)}: ${accessControl.name}`);
    }

    this.log.info('Auxiliary Sensors found:', omni.sensors.length);
    for (const [index, sensor] of omni.sensors.entries()) {
      this.log.info(`  ${String(index).padStart(3)}: ${sensor.name.padEnd(17)} [${AuxiliarySensorTypes[sensor.type]}]`);
    }
  }

  private async readCache(): Promise<Devices | undefined> {
    this.log.debug(this.constructor.name, 'readCache');
    
    if (this.settings.forceAutoDiscovery) {
      this.log.info('Forcing Auto-Discovery');
      return;
    }

    let devices: Devices;

    try {
      const content = await fs.promises.readFile(this._cacheFile, { encoding: 'utf8' });
      this.log.info(`Read config from cache [${this._cacheFile}]`);
      devices = JSON.parse(content);
    } catch {
      this.log.info('Performing Auto-Discovery');
      return;
    }

    return devices;
  }

  private async writeCache(devices?: Devices): Promise<void> {
    this.log.debug(this.constructor.name, 'writeCache', devices);

    if (devices !== undefined) {
      return;
    }

    devices = {
      areas: [...this.omniService.omni.areas.keys()],
      zones: [...this.omniService.omni.zones.keys()],
      units: [...this.omniService.omni.units.keys()],
      buttons: [...this.omniService.omni.buttons.keys()],
      thermostats: [...this.omniService.omni.thermostats.keys()],
      codes: [...this.omniService.omni.codes.keys()],
      accessControls: [...this.omniService.omni.accessControls.keys()],
    };

    try {
      this.log.info(`Writing config to cache [${this._cacheFile}]`);
      const content = JSON.stringify(devices);
      await fs.promises.mkdir(path.dirname(this._cacheFile), {recursive: true});
      await fs.promises.writeFile(this._cacheFile, content, { encoding: 'utf8'});
      
      // Remove the old config file if it exists
      try {
        await fs.promises.unlink(path.join(this.api.user.storagePath(), 'OmnilinkPlatform.json'));
      } catch {
        // do nothing
      }
    } catch(error) {
      if (error instanceof Error) {
        this.log.warn(`Writing config failed [${error.message}]`);
      }
    }
  }
}
