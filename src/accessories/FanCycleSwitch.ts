import { CharacteristicValue, PlatformAccessory } from 'homebridge';
import { OmniLinkPlatform } from '../platform';
import { AccessoryBase } from './AccessoryBase';
import { OmniObjectStatusTypes } from '../models/OmniObjectBase';
import { ThermostatStatus, FanModes } from '../models/Thermostat';

export class FanCycleSwitch extends AccessoryBase {
  constructor(
    platform: OmniLinkPlatform,
    platformAccessory: PlatformAccessory,   
  ) {
    super(platform, platformAccessory);

    this.service = this.platformAccessory.getService(this.platform.Service.Switch) ??
      this.platformAccessory.addService(this.platform.Service.Switch, platformAccessory.displayName);

    this.setEventHandlers();
  }

  static type = 'FanCycleSwitch';

  setEventHandlers(): void {
    this.platform.log.debug(this.constructor.name, 'setEventHandlers');
    
    this.service
      .getCharacteristic(this.platform.Characteristic.On)
      .onGet(this.getCharacteristicValue.bind(this, this.getFanCycleSwitchOn.bind(this), 'On'))
      .onSet(this.setCharacteristicValue.bind(this, this.setFanCycleSwitchOn.bind(this), 'On'));

    this.platform.omniService.on(
      this.platform.omniService.getEventKey(OmniObjectStatusTypes.Thermostat, this.platformAccessory.context.index),
      this.updateValues.bind(this));
  }

  private getFanCycleSwitchOn(): CharacteristicValue {
    this.platform.log.debug(this.constructor.name, 'getFanCycleSwitchOn');

    return this.platform.omniService.omni.thermostats[this.platformAccessory.context.index].status.fan === FanModes.Cycle;
  }

  private async setFanCycleSwitchOn(value: CharacteristicValue): Promise<void> {
    this.platform.log.debug(this.constructor.name, 'setFanCycleSwitchOn', value);

    if (this.getFanCycleSwitchOn() === value) {
      return;
    }

    await this.platform.omniService.setThermostatFanMode(this.platformAccessory.context.index, value ? FanModes.Cycle : FanModes.Auto);
  }

  updateValues(thermostatStatus: ThermostatStatus): void {
    this.platform.log.debug(this.constructor.name, 'updateValues', thermostatStatus);

    this.service
      .getCharacteristic(this.platform.Characteristic.On)
      .updateValue(thermostatStatus.fan === FanModes.Cycle);
  }
}