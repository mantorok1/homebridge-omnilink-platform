import { PlatformAccessory } from 'homebridge';
import { OmniLinkPlatform } from '../platform';
import { SensorBase } from './SensorBase';
import { AuxiliarySensorStatus } from '../models/AuxiliarySensorStatus';

export class TemperatureSensor extends SensorBase {
  private sensorId: number;

  constructor(
    platform: OmniLinkPlatform,
    platformAccessory: PlatformAccessory,   
  ) {
    super(platform, platformAccessory);

    this.sensorId = this.platform.settings.auxMap[this.platformAccessory.context.index] ??
      this.platformAccessory.context.index;

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

    this.platform.omniService.on(`zone-${this.platformAccessory.context.index}`, super.updateValues.bind(this));
    this.platform.omniService.on(`sensor-${this.sensorId}`, this.updateSensorValues.bind(this));
  }

  private async getCurrentTemperature(): Promise<number> {
    this.platform.log.debug(this.constructor.name, 'getCurrentTemperature');

    const auxiliarySensorStatus = await this.platform.omniService.getAuxiliarySensorStatus(this.sensorId);

    return auxiliarySensorStatus!.temperature;
  }

  updateSensorValues(sensorStatus: AuxiliarySensorStatus): void {
    this.platform.log.debug(this.constructor.name, 'updateSensorValues', sensorStatus);

    this.service
      .getCharacteristic(this.platform.Characteristic.CurrentTemperature)
      .updateValue(sensorStatus.temperature);
  }
}