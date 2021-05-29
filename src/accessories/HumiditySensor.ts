import { PlatformAccessory } from 'homebridge';
import { OmniLinkPlatform } from '../platform';
import { SensorBase } from './SensorBase';
import { AuxiliarySensorStatus } from '../models/AuxiliarySensorStatus';
import { ZoneStatus } from '../models/ZoneStatus';

export class HumiditySensor extends SensorBase {

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

    this.platform.omniService.on(ZoneStatus.getKey(this.platformAccessory.context.index), super.updateValues.bind(this));
    this.platform.omniService.on(AuxiliarySensorStatus.getKey(this.platformAccessory.context.index), this.updateSensorValues.bind(this));
  }

  private async getCurrentRelativeHumidity(): Promise<number> {
    this.platform.log.debug(this.constructor.name, 'getCurrentRelativeHumidity');

    const auxiliarySensorStatus = await this.platform.omniService.getAuxiliarySensorStatus(this.platformAccessory.context.index);

    return auxiliarySensorStatus!.humidity;
  }

  updateSensorValues(sensorStatus: AuxiliarySensorStatus): void {
    this.platform.log.debug(this.constructor.name, 'updateSensorValues', sensorStatus);

    this.service
      .getCharacteristic(this.platform.Characteristic.CurrentRelativeHumidity)
      .updateValue(sensorStatus.humidity);
  }
}