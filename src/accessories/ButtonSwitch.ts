import { PlatformAccessory } from 'homebridge';
import { OmniLinkPlatform } from '../platform';
import { AccessoryBase } from './AccessoryBase';

export class ButtonSwitch extends AccessoryBase {
  constructor(
    platform: OmniLinkPlatform,
    platformAccessory: PlatformAccessory,   
  ) {
    super(platform, platformAccessory);

    this.service = this.platformAccessory.getService(this.platform.Service.Switch) ??
      this.platformAccessory.addService(this.platform.Service.Switch, this.serviceName);

    this.setEventHandlers();
  }

  static type = 'Button';

  get serviceName(): string {
    return this.platform.omniService.buttons.get(this.platformAccessory.context.index)!.name
      ?? `${ButtonSwitch.type} ${this.platformAccessory.context.index}`;
  }

  setEventHandlers(): void {
    this.platform.log.debug(this.constructor.name, 'setEventHandlers');
    
    this.service
      .getCharacteristic(this.platform.Characteristic.On)
      .on('get', this.getCharacteristicValue.bind(this, this.getButtonSwitchOn.bind(this), 'On'))
      .on('set', this.setCharacteristicValue.bind(this, this.setButtonSwitchOn.bind(this), 'On'));

    this.platform.omniService.on(`button-${this.platformAccessory.context.index}`, this.updateValues.bind(this));
  }

  async getButtonSwitchOn(): Promise<boolean> {
    this.platform.log.debug(this.constructor.name, 'getButtonSwitchOn');

    return false;
  }

  async setButtonSwitchOn(value: boolean): Promise<void> {
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