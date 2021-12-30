import { CharacteristicValue, PlatformAccessory } from 'homebridge';
import { OmniLinkPlatform } from '../platform';
import { SensorBase } from './SensorBase';
import { ZoneStatus } from '../models/Zone';
import { OmniObjectStatusTypes } from '../models/OmniObjectBase';

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
      .onGet(this.getCharacteristicValue.bind(this, this.getMotionDetected.bind(this), 'MotionDetected'));

    this.platform.omniService.on(this.platform.omniService.getEventKey(OmniObjectStatusTypes.Zone, this.platformAccessory.context.index),
      this.updateValues.bind(this));
  }

  private getMotionDetected(): CharacteristicValue {
    this.platform.log.debug(this.constructor.name, 'getMotionDetected');

    const zoneStatus = this.platform.omniService.omni.zones[this.platformAccessory.context.index].status;

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