import { PlatformAccessory } from 'homebridge';
import { OmniLinkPlatform } from '../platform';
import { AccessoryBase } from './AccessoryBase';
import { UnitStatus, UnitStates } from '../models/Unit';
import { OmniObjectStatusTypes } from '../models/OmniObjectBase';

export class UnitSwitch extends AccessoryBase {
  constructor(
    platform: OmniLinkPlatform,
    platformAccessory: PlatformAccessory,   
  ) {
    super(platform, platformAccessory);

    this.service = this.platformAccessory.getService(this.platform.Service.Switch) ??
      this.platformAccessory.addService(this.platform.Service.Switch, platformAccessory.displayName);

    this.setEventHandlers();
  }

  protected async identifyHandler(): Promise<void> {
    const state = this.getUnitSwitchOn();
    await this.setUnitSwitchOn(!state);
    super.identifyHandler();
  }

  static type = 'UnitSwitch';

  setEventHandlers(): void {
    this.platform.log.debug(this.constructor.name, 'setEventHandlers');
    
    this.service
      .getCharacteristic(this.platform.Characteristic.On)
      .on('get', this.getCharacteristicValue.bind(this, this.getUnitSwitchOn.bind(this), 'On'))
      .on('set', this.setCharacteristicValue.bind(this, this.setUnitSwitchOn.bind(this), 'On'));

    this.platform.omniService.on(this.platform.omniService.getEventKey(OmniObjectStatusTypes.Unit, this.platformAccessory.context.index),
      this.updateValues.bind(this));
  }

  private getUnitSwitchOn(): boolean {
    this.platform.log.debug(this.constructor.name, 'getUnitSwitchOn');

    return this.platform.omniService.omni.units[this.platformAccessory.context.index].status.state === UnitStates.On;
  }

  private async setUnitSwitchOn(value: boolean): Promise<void> {
    this.platform.log.debug(this.constructor.name, 'setUnitSwitchOn', value);

    if (this.getUnitSwitchOn() === value) {
      return;
    }

    await this.platform.omniService.setUnitState(this.platformAccessory.context.index, value);
  }

  updateValues(status: UnitStatus): void {
    this.platform.log.debug(this.constructor.name, 'updateValues', status);

    this.service
      .getCharacteristic(this.platform.Characteristic.On)
      .updateValue(status.state === UnitStates.On);
  }
}