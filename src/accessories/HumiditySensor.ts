import { PlatformAccessory } from 'homebridge';
import { OmniLinkPlatform } from '../platform';
import { AccessoryBase } from './AccessoryBase';
import { AuxiliarySensorStatus } from '../models/AuxiliarySensorStatus';

export class HumiditySensor extends AccessoryBase {
  constructor(
    platform: OmniLinkPlatform,
    platformAccessory: PlatformAccessory,   
  ) {
    super(platform, platformAccessory);

    this.service = this.platformAccessory.getService(this.platform.Service.HumiditySensor) ??
      this.platformAccessory.addService(this.platform.Service.HumiditySensor, platformAccessory.displayName);

    this.setEventHandlers();
  }

  static type = 'HumiditySensor';

  setEventHandlers(): void {
    this.platform.log.debug(this.constructor.name, 'setEventHandlers');
    
    this.service
      .getCharacteristic(this.platform.Characteristic.CurrentRelativeHumidity)
      .on('get', this.getCharacteristicValue.bind(this, this.getCurrentRelativeHumidity.bind(this), 'CurrentRelativeHumidity'));

    this.platform.omniService.on(`sensor-${this.platformAccessory.context.index}`, this.updateValues.bind(this));
  }

  private async getCurrentRelativeHumidity(): Promise<number> {
    this.platform.log.debug(this.constructor.name, 'getCurrentRelativeHumidity');

    const auxiliarySensorStatus = await this.platform.omniService.getAuxiliarySensorStatus(this.platformAccessory.context.index);

    return auxiliarySensorStatus!.humidity;
  }

  updateValues(sensorStatus: AuxiliarySensorStatus): void {
    this.platform.log.debug(this.constructor.name, 'updateValues', sensorStatus);

    this.service
      .getCharacteristic(this.platform.Characteristic.CurrentRelativeHumidity)
      .updateValue(sensorStatus.humidity);
  }
}