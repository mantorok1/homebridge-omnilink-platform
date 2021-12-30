import { CharacteristicValue, PlatformAccessory } from 'homebridge';
import { OmniObjectStatusTypes } from '../models/OmniObjectModel';
import { OmniLinkPlatform } from '../platform';
import { AccessoryBase } from './AccessoryBase';

export class ButtonSwitch extends AccessoryBase {
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
    await this.setButtonSwitchOn(true);
    super.identifyHandler();
  }

  static type = 'Button';

  setEventHandlers(): void {
    this.platform.log.debug(this.constructor.name, 'setEventHandlers');
    
    this.service
      .getCharacteristic(this.platform.Characteristic.On)
      .onGet(this.getCharacteristicValue.bind(this, this.getButtonSwitchOn.bind(this), 'On'))
      .onSet(this.setCharacteristicValue.bind(this, this.setButtonSwitchOn.bind(this), 'On'));

    this.platform.omniService.on(this.platform.omniService.getEventKey(OmniObjectStatusTypes.Button, this.platformAccessory.context.index),
      this.updateValues.bind(this));
  }

  private getButtonSwitchOn(): CharacteristicValue {
    this.platform.log.debug(this.constructor.name, 'getButtonSwitchOn');

    return false;
  }

  private async setButtonSwitchOn(value: CharacteristicValue): Promise<void> {
    this.platform.log.debug(this.constructor.name, 'setButtonSwitchOn', value);

    if (value) {
      await this.platform.omniService.executeButton(this.platformAccessory.context.index);
    }
  }

  updateValues(): void {
    this.platform.log.debug(this.constructor.name, 'updateValues');

    setTimeout(() => {
      this.service
        .getCharacteristic(this.platform.Characteristic.On)
        .updateValue(false);
    }, 1000);
  }
}