import { API, DynamicPlatformPlugin, Logger, PlatformAccessory, PlatformConfig, Service, Characteristic } from 'homebridge';
import { PLATFORM_NAME, PLUGIN_NAME } from './settings';
import { Settings } from './models/Settings';
import { OmniService } from './omni/OmniService';
import { AccessoryService } from './accessories/AccessoryService';
import { PushoverService } from './services/PushoverService';
import { MqttService } from './services/MqttService';

export class OmniLinkPlatform implements DynamicPlatformPlugin {
  public readonly Service: typeof Service = this.api.hap.Service;
  public readonly Characteristic: typeof Characteristic = this.api.hap.Characteristic;

  private deletedAccessories: PlatformAccessory[] = [];

  public readonly settings!: Settings;
  public readonly omniService!: OmniService;
  public readonly accessoryService!: AccessoryService;
  public readonly pushoverService!: PushoverService;
  public readonly mqttService!: MqttService;

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

  configureAccessory(platformAccessory: PlatformAccessory) {
    this.log.debug(this.constructor.name, 'configureAccessory');

    if (this.settings.clearCache) {
      this.deletedAccessories.push(platformAccessory);
      return;
    }

    this.accessoryService.configure(platformAccessory);
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

      await this.omniService.init();

      await this.omniService.discover();

      this.log.info(`Found: ${this.omniService.model} [Firmware version: ${this.omniService.version}]`);

      // Display found devices
      this.log.info('Areas found:', this.omniService.areas.size);
      for (const [index, area] of this.omniService.areas) {
        this.log.info(`  ${index}: ${area.name}`);
      }

      this.log.info('Zones found:', this.omniService.zones.size);
      for (const [index, zone] of this.omniService.zones) {
        this.log.info(`  ${index}: ${zone.name}`);
      }

      this.log.info('Units found:', this.omniService.units.size);
      for (const [index, unit] of this.omniService.units) {
        this.log.info(`  ${index}: ${unit.name} [${unit.unitState}, ${unit.unitTime}, ${unit.unitType}]`);
      }

      this.log.info('Buttons found:', this.omniService.buttons.size);
      for (const [index, button] of this.omniService.buttons) {
        this.log.info(`  ${index}: ${button.name}`);
      }

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
}
