import { CharacteristicValue, PlatformAccessory } from 'homebridge';
import { OmniLinkPlatform } from '../platform';
import { AccessoryBase } from './AccessoryBase';
import { UnitStatus, UnitStates } from '../models/Unit';
import { OmniObjectStatusTypes } from '../models/OmniObjectBase';

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
    const state = this.getUnitLightbulbOn();
    await this.setUnitLightbulbOn(!state);
    super.identifyHandler();
  }

  static type = 'UnitLightbulb';

  setEventHandlers(): void {
    this.platform.log.debug(this.constructor.name, 'setEventHandlers');
    
    this.service
      .getCharacteristic(this.platform.Characteristic.On)
      .onGet(this.getCharacteristicValue.bind(this, this.getUnitLightbulbOn.bind(this), 'On'))
      .onSet(this.setCharacteristicValue.bind(this, this.setUnitLightbulbOn.bind(this), 'On'));

    this.service
      .getCharacteristic(this.platform.Characteristic.Brightness)
      .onGet(this.getCharacteristicValue.bind(this, this.getUnitLightbulbBrightness.bind(this), 'Brightness'))
      .onSet(this.setCharacteristicValue.bind(this, this.setUnitLightbulbBrightness.bind(this), 'Brightness'));

    this.platform.omniService.on(this.platform.omniService.getEventKey(OmniObjectStatusTypes.Unit, this.platformAccessory.context.index),
      this.updateValues.bind(this));
  }

  private getUnitLightbulbOn(): CharacteristicValue {
    this.platform.log.debug(this.constructor.name, 'getUnitLightbulbOn');

    return this.platform.omniService.omni.units[this.platformAccessory.context.index].status.state === UnitStates.On;
  }

  private async setUnitLightbulbOn(value: CharacteristicValue): Promise<void> {
    this.platform.log.debug(this.constructor.name, 'setUnitLightbulbOn', value);

    if (this.getUnitLightbulbOn() === value) {
      return;
    }

    await this.platform.omniService.setUnitState(this.platformAccessory.context.index, value as boolean);
  }

  private getUnitLightbulbBrightness(): CharacteristicValue {
    this.platform.log.debug(this.constructor.name, 'getUnitLightbulbBrightness');

    return this.platform.omniService.omni.units[this.platformAccessory.context.index].status.brightness;
  }

  private async setUnitLightbulbBrightness(value: CharacteristicValue): Promise<void> {
    this.platform.log.debug(this.constructor.name, 'setUnitLightbulbBrightness', value);

    if (this.getUnitLightbulbBrightness() === value) {
      return;
    }

    await this.platform.omniService.setUnitBrightness(this.platformAccessory.context.index, value as number);
  }

  updateValues(status: UnitStatus): void {
    this.platform.log.debug(this.constructor.name, 'updateValues', status);

    this.service
      .getCharacteristic(this.platform.Characteristic.On)
      .updateValue(status.state === UnitStates.On);

    this.service
      .getCharacteristic(this.platform.Characteristic.Brightness)
      .updateValue(status.brightness);
  }
}