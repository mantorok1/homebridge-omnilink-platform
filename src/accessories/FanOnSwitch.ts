import { CharacteristicValue, PlatformAccessory } from 'homebridge';
import { OmniLinkPlatform } from '../platform';
import { AccessoryBase } from './AccessoryBase';
import { OmniObjectStatusTypes } from '../models/OmniObjectBase';
import { ThermostatStatus, FanModes } from '../models/Thermostat';

export class FanOnSwitch extends AccessoryBase {
  constructor(
    platform: OmniLinkPlatform,
    platformAccessory: PlatformAccessory,   
  ) {
    super(platform, platformAccessory);

    this.service = this.platformAccessory.getService(this.platform.Service.Switch) ??
      this.platformAccessory.addService(this.platform.Service.Switch, platformAccessory.displayName);

    this.setEventHandlers();
  }

  static type = 'FanOnSwitch';

  setEventHandlers(): void {
    this.platform.log.debug(this.constructor.name, 'setEventHandlers');
    
    this.service
      .getCharacteristic(this.platform.Characteristic.On)
      .onGet(this.getCharacteristicValue.bind(this, this.getFanOnSwitchOn.bind(this), 'On'))
      .onSet(this.setCharacteristicValue.bind(this, this.setFanOnSwitchOn.bind(this), 'On'));

    this.platform.omniService.on(
      this.platform.omniService.getEventKey(OmniObjectStatusTypes.Thermostat, this.platformAccessory.context.index),
      this.updateValues.bind(this));
  }

  private getFanOnSwitchOn(): CharacteristicValue {
    this.platform.log.debug(this.constructor.name, 'getFanOnSwitchOn');

    return this.platform.omniService.omni.thermostats[this.platformAccessory.context.index].status.fan === FanModes.On;
  }

  private async setFanOnSwitchOn(value: CharacteristicValue): Promise<void> {
    this.platform.log.debug(this.constructor.name, 'setFanOnSwitchOn', value);

    if (this.getFanOnSwitchOn() === value) {
      return;
    }

    await this.platform.omniService.setThermostatFanMode(this.platformAccessory.context.index, value ? FanModes.On : FanModes.Auto);
  }

  updateValues(thermostatStatus: ThermostatStatus): void {
    this.platform.log.debug(this.constructor.name, 'updateValues', thermostatStatus);

    this.service
      .getCharacteristic(this.platform.Characteristic.On)
      .updateValue(thermostatStatus.fan === FanModes.On);
  }
}