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
      this.platformAccessory.addService(this.platform.Service.Lightbulb, platformAccessory.displayName);

    this.setEventHandlers();
  }

  protected async identifyHandler(): Promise<void> {
    const state = await this.getUnitLightbulbOn();
    await this.setUnitLightbulbOn(!state);
    super.identifyHandler();
  }

  static type = 'UnitLightbulb';

  setEventHandlers(): void {
    this.platform.log.debug(this.constructor.name, 'setEventHandlers');
    
    this.service
      .getCharacteristic(this.platform.Characteristic.On)
      .on('get', this.getCharacteristicValue.bind(this, this.getUnitLightbulbOn.bind(this), 'On'))
      .on('set', this.setCharacteristicValue.bind(this, this.setUnitLightbulbOn.bind(this), 'On'));

    this.service
      .getCharacteristic(this.platform.Characteristic.Brightness)
      .on('get', this.getCharacteristicValue.bind(this, this.getUnitLightbulbBrightness.bind(this), 'Brightness'))
      .on('set', this.setCharacteristicValue.bind(this, this.setUnitLightbulbBrightness.bind(this), 'Brightness'));

    this.platform.omniService.on(UnitStatus.getKey(this.platformAccessory.context.index), this.updateValues.bind(this));
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

  async getUnitLightbulbBrightness(): Promise<number> {
    this.platform.log.debug(this.constructor.name, 'getUnitLightbulbBrightness');

    const unitStatus = await this.platform.omniService.getUnitStatus(this.platformAccessory.context.index);

    return unitStatus!.brightness;
  }

  async setUnitLightbulbBrightness(value: number): Promise<void> {
    this.platform.log.debug(this.constructor.name, 'setUnitLightbulbBrightness', value);

    if (await this.getUnitLightbulbBrightness() === value) {
      return;
    }

    await this.platform.omniService.setUnitBrightness(this.platformAccessory.context.index, value);
  }

  updateValues(unitStatus: UnitStatus): void {
    this.platform.log.debug(this.constructor.name, 'updateValues', unitStatus);

    this.service
      .getCharacteristic(this.platform.Characteristic.On)
      .updateValue(unitStatus.state === UnitStates.On);

    if (unitStatus.brightness !== undefined) {
      this.service
        .getCharacteristic(this.platform.Characteristic.Brightness)
        .updateValue(unitStatus.brightness);
    }
  }
}