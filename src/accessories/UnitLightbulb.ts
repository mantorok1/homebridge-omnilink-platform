import { PlatformAccessory } from 'homebridge';
import { OmniLinkPlatform } from '../platform';
import { AccessoryBase } from './AccessoryBase';
import { UnitStatus, UnitStates } from '../models/UnitStatus';

export class UnitLightbulb extends AccessoryBase {
  constructor(
    platform: OmniLinkPlatform,
    platformAccessory: PlatformAccessory,   
  ) {
    super(platform, platformAccessory);

    this.service = this.platformAccessory.getService(this.platform.Service.Lightbulb) ??
      this.platformAccessory.addService(this.platform.Service.Lightbulb, this.serviceName);

    this.setEventHandlers();
  }

  static type = 'UnitLightbulb';

  get serviceName(): string {
    return this.platform.omniService.units.get(this.platformAccessory.context.index)!.name
      ?? `${UnitLightbulb.type} ${this.platformAccessory.context.index}`;
  }

  setEventHandlers(): void {
    this.platform.log.debug(this.constructor.name, 'setEventHandlers');
    
    this.service
      .getCharacteristic(this.platform.Characteristic.On)
      .on('get', this.getCharacteristicValue.bind(this, this.getUnitLightbulbOn.bind(this), 'On'))
      .on('set', this.setCharacteristicValue.bind(this, this.setUnitLightbulbOn.bind(this), 'On'));

    this.platform.omniService.on(`unit-${this.platformAccessory.context.index}`, this.updateValues.bind(this));
  }

  async getUnitLightbulbOn(): Promise<boolean> {
    this.platform.log.debug(this.constructor.name, 'getUnitLightbulbOn');

    const unitStatus = await this.platform.omniService.getUnitStatus(this.platformAccessory.context.index);

    return unitStatus!.state === UnitStates.On;
  }

  async setUnitLightbulbOn(value: boolean): Promise<void> {
    this.platform.log.debug(this.constructor.name, 'setUnitLightbulbOn', value);

    if (await this.getUnitLightbulbOn() === value) {
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