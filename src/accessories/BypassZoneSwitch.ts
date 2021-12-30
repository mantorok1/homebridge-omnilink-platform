import { CharacteristicValue, PlatformAccessory } from 'homebridge';
import { OmniLinkPlatform } from '../platform';
import { AccessoryBase } from './AccessoryBase';
import { ZoneStatus } from '../models/Zone';
import { OmniObjectStatusTypes } from '../models/OmniObjectBase';

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
      .onGet(this.getCharacteristicValue.bind(this, this.getBypassZoneSwitchOn.bind(this), 'On'))
      .onSet(this.setCharacteristicValue.bind(this, this.setBypassZoneSwitchOn.bind(this), 'On'));

    this.platform.omniService.on(this.platform.omniService.getEventKey(OmniObjectStatusTypes.Zone, this.platformAccessory.context.index),
      this.updateValues.bind(this));
  }

  private getBypassZoneSwitchOn(): CharacteristicValue {
    this.platform.log.debug(this.constructor.name, 'getBypassZoneSwitchOn');

    const zoneStatus = this.platform.omniService.omni.zones[this.platformAccessory.context.index].status;

    return zoneStatus!.bypassed;
  }

  private async setBypassZoneSwitchOn(value: CharacteristicValue): Promise<void> {
    this.platform.log.debug(this.constructor.name, 'setBypassZoneSwitchOn', value);

    if (this.getBypassZoneSwitchOn() === value) {
      return;
    }

    await this.platform.omniService.setZoneBypass(this.platformAccessory.context.index, value as boolean);
  }

  updateValues(zoneStatus: ZoneStatus): void {
    this.platform.log.debug(this.constructor.name, 'updateValues', zoneStatus);

    this.service
      .getCharacteristic(this.platform.Characteristic.On)
      .updateValue(zoneStatus.bypassed);
  }
}