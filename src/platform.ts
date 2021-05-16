import { API, DynamicPlatformPlugin, Logger, PlatformAccessory, PlatformConfig, Service, Characteristic } from 'homebridge';
import { PLATFORM_NAME, PLUGIN_NAME } from './settings';
import { Settings } from './models/Settings';
import { OmniService, Devices } from './omni/OmniService';
import { AccessoryService } from './accessories/AccessoryService';
import { PushoverService } from './services/PushoverService';
import { MqttService } from './services/MqttService';
import { ZoneTypes, UnitTypes } from './omni/messages/enums';
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
      this.log.error(error);
    }
  }

  async configureAccessory(platformAccessory: PlatformAccessory) {
    this.log.debug(this.constructor.name, 'configureAccessory');

    if (this.settings.clearCache) {
      this.deletedAccessories.push(platformAccessory);
      return;
    }

    await this.initOmniService();

    this.accessoryService.configure(platformAccessory);
  }

  private async initOmniService(): Promise<void> {
    this.log.debug(this.constructor.name, 'initService');

    return new Promise((resolve) => {
      if (this._serviceInitialised) {
        resolve();
      }

      this.omniService.once('initialised', () => {
        this._serviceInitialised = true;
        this._serviceInitialising = false;
        resolve();
      });

      if (!this._serviceInitialising) {
        this._serviceInitialising = true;
        this.omniService.init();
      }
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

      const devices = await this.readCache();
      await this.omniService.discover(devices);
      await this.writeCache(devices);

      this.displayDevices();

      // Add/Remove accessories
      this.accessoryService.discover();

      // Initialise Pushover notifications
      this.pushoverService.init();

      // Initialise MQTT
      this.mqttService.init();

    } catch (error) {
      this.log.error(error);
    }
  }

  private displayDevices(): void {
    this.log.debug(this.constructor.name, 'displayDevices');

    this.log.info(`Found: ${this.omniService.model} [Firmware version: ${this.omniService.version}]`);

    // Display found devices
    this.log.info('Areas found:', this.omniService.areas.size);
    for (const [index, area] of this.omniService.areas) {
      this.log.info(`  ${String(index).padStart(3)}: ${area.name}`);
    }

    this.log.info('Zones found:', this.omniService.zones.size);
    for (const [index, zone] of this.omniService.zones) {
      this.log.info(`  ${String(index).padStart(3)}: ${zone.name.padEnd(17)} [${ZoneTypes[zone.zoneType]}]`);
    }

    this.log.info('Units found:', this.omniService.units.size);
    for (const [index, unit] of this.omniService.units) {
      this.log.info(`  ${String(index).padStart(3)}: ${unit.name.padEnd(17)} [${UnitTypes[unit.unitType]}]`);
    }

    this.log.info('Buttons found:', this.omniService.buttons.size);
    for (const [index, button] of this.omniService.buttons) {
      this.log.info(`  ${String(index).padStart(3)}: ${button.name}`);
    }

    this.log.info('Thermostats found:', this.omniService.thermostats.size);
    for (const [index, thermostat] of this.omniService.thermostats) {
      this.log.info(`  ${String(index).padStart(3)}: ${thermostat.name}`);
    }

    this.log.info('Access Controls found:', this.omniService.accessControls.size);
    for (const [index, accessControl] of this.omniService.accessControls) {
      this.log.info(`  ${String(index).padStart(3)}: ${accessControl.name}`);
    }

    this.log.info('Auxiliary Sensors found:', this.omniService.auxiliarySensors.size);
    for (const [index, auxiliarySensor] of this.omniService.auxiliarySensors) {
      this.log.info(`  ${String(index).padStart(3)}: ${auxiliarySensor.name}`);
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
      areas: [...this.omniService.areas.keys()],
      zones: [...this.omniService.zones.keys()],
      units: [...this.omniService.units.keys()],
      buttons: [...this.omniService.buttons.keys()],
      thermostats: [...this.omniService.thermostats.keys()],
      codes: [...this.omniService.codes.keys()],
      accessControls: [...this.omniService.accessControls.keys()],
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
    } catch(ex) {
      this.log.warn(`Writing config failed [${ex.message}]`);
    }
  }
}
