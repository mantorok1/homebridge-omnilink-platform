import { PlatformAccessory } from 'homebridge';
import { OmniLinkPlatform } from '../platform';
import { SensorBase } from './SensorBase';
import { AuxiliarySensorStatus } from '../models/AuxiliarySensor';
import { OmniObjectStatusTypes } from '../models/OmniObjectBase';

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

    this.platform.omniService.on(
      this.platform.omniService.getEventKey(OmniObjectStatusTypes.Zone, this.platformAccessory.context.index),
      super.updateValues.bind(this));
    this.platform.omniService.on(
      this.platform.omniService.getEventKey(OmniObjectStatusTypes.AuxiliarySensor, this.platformAccessory.context.index),
      this.updateSensorValues.bind(this));
  }

  private getCurrentRelativeHumidity(): number {
    this.platform.log.debug(this.constructor.name, 'getCurrentRelativeHumidity');

    return this.platform.omniService.omni.sensors[this.platformAccessory.context.index].status.temperature.toPercentage();
  }

  updateSensorValues(status: AuxiliarySensorStatus): void {
    this.platform.log.debug(this.constructor.name, 'updateSensorValues', status);

    this.service
      .getCharacteristic(this.platform.Characteristic.CurrentRelativeHumidity)
      .updateValue(status.temperature.toPercentage());
  }
}