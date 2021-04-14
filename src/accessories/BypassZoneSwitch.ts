import { PlatformAccessory } from 'homebridge';
import { OmniLinkPlatform } from '../platform';
import { AccessoryBase } from './AccessoryBase';
import { ZoneStatus } from '../models/ZoneStatus';

export class BypassZoneSwitch extends AccessoryBase {
  constructor(
    platform: OmniLinkPlatform,
    platformAccessory: PlatformAccessory,   
  ) {
    super(platform, platformAccessory);

    this.service = this.platformAccessory.getService(this.platform.Service.Switch) ??
      this.platformAccessory.addService(this.platform.Service.Switch, platformAccessory.displayName);

    this.setEventHandlers();
  }

  static type = 'BypassZoneSwitch';

  setEventHandlers(): void {
    this.platform.log.debug(this.constructor.name, 'setEventHandlers');
    
    this.service
      .getCharacteristic(this.platform.Characteristic.On)
      .on('get', this.getCharacteristicValue.bind(this, this.getBypassZoneSwitchOn.bind(this), 'On'))
      .on('set', this.setCharacteristicValue.bind(this, this.setBypassZoneSwitchOn.bind(this), 'On'));

    this.platform.omniService.on(`zone-${this.platformAccessory.context.index}`, this.updateValues.bind(this));
  }

  async getBypassZoneSwitchOn(): Promise<boolean> {
    this.platform.log.debug(this.constructor.name, 'getBypassZoneSwitchOn');

    const zoneStatus = await this.platform.omniService.getZoneStatus(this.platformAccessory.context.index);

    return zoneStatus!.bypassed;
  }

  async setBypassZoneSwitchOn(value: boolean): Promise<void> {
    this.platform.log.debug(this.constructor.name, 'setBypassZoneSwitchOn', value);

    if (await this.getBypassZoneSwitchOn() === value) {
      return;
    }

    await this.platform.omniService.setZoneBypass(this.platformAccessory.context.index, value);
  }

  updateValues(zoneStatus: ZoneStatus): void {
    this.platform.log.debug(this.constructor.name, 'updateValues', zoneStatus);

    this.service
      .getCharacteristic(this.platform.Characteristic.On)
      .updateValue(zoneStatus.bypassed);
  }
}