import { PlatformAccessory } from 'homebridge';
import { OmniLinkPlatform } from '../platform';
import { SensorBase } from './SensorBase';
import { ZoneStatus } from '../models/Zone';
import { OmniObjectStatusTypes } from '../models/OmniObjectBase';

export class LeakSensor extends SensorBase {
  constructor(
    platform: OmniLinkPlatform,
    platformAccessory: PlatformAccessory,   
  ) {
    super(platform, platformAccessory);

    this.service = this.platformAccessory.getService(this.platform.Service.LeakSensor) ??
      this.platformAccessory.addService(this.platform.Service.LeakSensor, platformAccessory.displayName);

    this.setEventHandlers();
  }

  static type = 'LeakSensor';

  setEventHandlers(): void {
    this.platform.log.debug(this.constructor.name, 'setEventHandlers');
    
    super.setEventHandlers();

    this.service
      .getCharacteristic(this.platform.Characteristic.LeakDetected)
      .on('get', this.getCharacteristicValue.bind(this, this.getLeakDetected.bind(this), 'LeakDetected'));

    this.platform.omniService.on(this.platform.omniService.getEventKey(OmniObjectStatusTypes.Zone, this.platformAccessory.context.index),
      this.updateValues.bind(this));
  }

  private getLeakDetected(): number {
    this.platform.log.debug(this.constructor.name, 'getLeakDetected');

    const zoneStatus = this.platform.omniService.omni.zones[this.platformAccessory.context.index].status;

    return zoneStatus!.ready
      ? this.platform.Characteristic.LeakDetected.LEAK_NOT_DETECTED
      : this.platform.Characteristic.LeakDetected.LEAK_DETECTED;
  }

  updateValues(zoneStatus: ZoneStatus): void {
    this.platform.log.debug(this.constructor.name, 'updateValues', zoneStatus);

    super.updateValues(zoneStatus);

    const leakDetected = zoneStatus!.ready
      ? this.platform.Characteristic.LeakDetected.LEAK_NOT_DETECTED
      : this.platform.Characteristic.LeakDetected.LEAK_DETECTED;

    this.service
      .getCharacteristic(this.platform.Characteristic.LeakDetected)
      .updateValue(leakDetected);
  }
}