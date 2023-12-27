import { CharacteristicValue, PlatformAccessory } from 'homebridge';
import { OmniLinkPlatform } from '../platform';
import { AccessoryBase } from './AccessoryBase';
import { OmniObjectStatusTypes } from '../models/OmniObjectBase';
import { ThermostatStatus, HoldStates } from '../models/Thermostat';

export class HoldStatusSwitch extends AccessoryBase {
  constructor(
    platform: OmniLinkPlatform,
    platformAccessory: PlatformAccessory,   
  ) {
    super(platform, platformAccessory);

    this.service = this.platformAccessory.getService(this.platform.Service.Switch) ??
      this.platformAccessory.addService(this.platform.Service.Switch, platformAccessory.displayName);

    this.setEventHandlers();
  }

  static type = 'HoldStatusSwitch';

  setEventHandlers(): void {
    this.platform.log.debug(this.constructor.name, 'setEventHandlers');
    
    this.service
      .getCharacteristic(this.platform.Characteristic.On)
      .onGet(this.getCharacteristicValue.bind(this, this.getHoldStatusSwitchOn.bind(this), 'On'))
      .onSet(this.setCharacteristicValue.bind(this, this.setHoldStatusSwitchOn.bind(this), 'On'));

    this.platform.omniService.on(
      this.platform.omniService.getEventKey(OmniObjectStatusTypes.Thermostat, this.platformAccessory.context.index),
      this.updateValues.bind(this));
  }

  private getHoldStatusSwitchOn(): CharacteristicValue {
    this.platform.log.debug(this.constructor.name, 'getHoldStatusSwitchOn');

    return this.platform.omniService.omni.thermostats[this.platformAccessory.context.index].status.hold !== HoldStates.Off;
  }

  private async setHoldStatusSwitchOn(value: CharacteristicValue): Promise<void> {
    this.platform.log.debug(this.constructor.name, 'setHoldStatusSwitchOn', value);

    if (this.getHoldStatusSwitchOn() === value) {
      return;
    }

    await this.platform.omniService.setThermostatHoldState(this.platformAccessory.context.index, value ? HoldStates.Hold : HoldStates.Off);
  }

  updateValues(thermostatStatus: ThermostatStatus): void {
    this.platform.log.debug(this.constructor.name, 'updateValues', thermostatStatus);

    this.service
      .getCharacteristic(this.platform.Characteristic.On)
      .updateValue(thermostatStatus.hold !== HoldStates.Off);
  }
}