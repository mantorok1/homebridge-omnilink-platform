import { PlatformAccessory } from 'homebridge';
import { OmniLinkPlatform } from '../platform';
import { AccessoryBase } from './AccessoryBase';
import { UnitStatus, UnitStates } from '../models/UnitStatus';

export class UnitSwitch extends AccessoryBase {
  constructor(
    platform: OmniLinkPlatform,
    platformAccessory: PlatformAccessory,   
  ) {
    super(platform, platformAccessory);

    this.service = this.platformAccessory.getService(this.platform.Service.Switch) ??
      this.platformAccessory.addService(this.platform.Service.Switch, this.serviceName);

    this.setEventHandlers();
  }

  static type = 'UnitSwitch';

  get serviceName(): string {
    return this.platform.omniService.units.get(this.platformAccessory.context.index)!.name
      ?? `${UnitSwitch.type} ${this.platformAccessory.context.index}`;
  }

  setEventHandlers(): void {
    this.platform.log.debug(this.constructor.name, 'setEventHandlers');
    
    this.service
      .getCharacteristic(this.platform.Characteristic.On)
      .on('get', this.getCharacteristicValue.bind(this, this.getUnitSwitchOn.bind(this), 'On'))
      .on('set', this.setCharacteristicValue.bind(this, this.setUnitSwitchOn.bind(this), 'On'));

    this.platform.omniService.on(`unit-${this.platformAccessory.context.index}`, this.updateValues.bind(this));
  }

  async getUnitSwitchOn(): Promise<boolean> {
    this.platform.log.debug(this.constructor.name, 'getUnitSwitchOn');

    const unitStatus = await this.platform.omniService.getUnitStatus(this.platformAccessory.context.index);

    return unitStatus!.state === UnitStates.On;
  }

  async setUnitSwitchOn(value: boolean): Promise<void> {
    this.platform.log.debug(this.constructor.name, 'setUnitSwitchOn', value);

    if (await this.getUnitSwitchOn() === value) {
      return;
    }

    await this.platform.omniService.setUnitState(this.platformAccessory.context.index, value);
  }

  updateValues(unitStatus: UnitStatus): void {
    this.platform.log.debug(this.constructor.name, 'updateValues', unitStatus);

    if (unitStatus.state === 0 || unitStatus.state === 1) {
      this.service
        .getCharacteristic(this.platform.Characteristic.On)
        .updateValue(unitStatus.state === UnitStates.On);
    }
  }
}