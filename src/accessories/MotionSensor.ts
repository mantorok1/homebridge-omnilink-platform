import { PlatformAccessory } from 'homebridge';
import { OmniLinkPlatform } from '../platform';
import { SensorBase } from './SensorBase';
import { ZoneStatus } from '../models/ZoneStatus';

export class MotionSensor extends SensorBase {
  constructor(
    platform: OmniLinkPlatform,
    platformAccessory: PlatformAccessory,   
  ) {
    super(platform, platformAccessory);

    this.service = this.platformAccessory.getService(this.platform.Service.MotionSensor) ??
      this.platformAccessory.addService(this.platform.Service.MotionSensor, platformAccessory.displayName);

    this.setEventHandlers();
  }

  static type = 'MotionSensor';

  setEventHandlers(): void {
    this.platform.log.debug(this.constructor.name, 'setEventHandlers');
    
    super.setEventHandlers();

    this.service
      .getCharacteristic(this.platform.Characteristic.MotionDetected)
      .on('get', this.getCharacteristicValue.bind(this, this.getMotionDetected.bind(this), 'MotionDetected'));

    this.platform.omniService.on(`zone-${this.platformAccessory.context.index}`, this.updateValues.bind(this));
  }

  private async getMotionDetected(): Promise<boolean> {
    this.platform.log.debug(this.constructor.name, 'getMotionDetected');

    const zoneStatus = await this.platform.omniService.getZoneStatus(this.platformAccessory.context.index);

    return !zoneStatus!.ready;
  }

  updateValues(zoneStatus: ZoneStatus): void {
    this.platform.log.debug(this.constructor.name, 'updateValues', zoneStatus);

    super.updateValues(zoneStatus);

    this.service
      .getCharacteristic(this.platform.Characteristic.MotionDetected)
      .updateValue(!zoneStatus.ready);
  }
}