import { PlatformAccessory } from 'homebridge';
import { OmniLinkPlatform } from '../platform';
import { AccessoryBase } from './AccessoryBase';
import { AuxiliarySensorStatus } from '../models/AuxiliarySensorStatus';

export class TemperatureSensor extends AccessoryBase {
  constructor(
    platform: OmniLinkPlatform,
    platformAccessory: PlatformAccessory,   
  ) {
    super(platform, platformAccessory);

    this.service = this.platformAccessory.getService(this.platform.Service.TemperatureSensor) ??
      this.platformAccessory.addService(this.platform.Service.TemperatureSensor, platformAccessory.displayName);

    this.setEventHandlers();
  }

  static type = 'TemperatureSensor';

  setEventHandlers(): void {
    this.platform.log.debug(this.constructor.name, 'setEventHandlers');
    
    this.service
      .getCharacteristic(this.platform.Characteristic.CurrentTemperature)
      .on('get', this.getCharacteristicValue.bind(this, this.getCurrentTemperature.bind(this), 'CurrentTemperature'));

    this.platform.omniService.on(`sensor-${this.platformAccessory.context.index}`, this.updateValues.bind(this));
  }

  private async getCurrentTemperature(): Promise<number> {
    this.platform.log.debug(this.constructor.name, 'getCurrentTemperature');

    const auxiliarySensorStatus = await this.platform.omniService.getAuxiliarySensorStatus(this.platformAccessory.context.index);

    return auxiliarySensorStatus!.temperature;
  }

  updateValues(sensorStatus: AuxiliarySensorStatus): void {
    this.platform.log.debug(this.constructor.name, 'updateValues', sensorStatus);

    this.service
      .getCharacteristic(this.platform.Characteristic.CurrentTemperature)
      .updateValue(sensorStatus.temperature);
  }
}