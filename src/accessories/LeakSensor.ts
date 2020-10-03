import { PlatformAccessory } from 'homebridge';
import { OmniLinkPlatform } from '../platform';
import { SensorBase } from './SensorBase';
import { ZoneStatus } from '../omni/OmniService';

export class LeakSensor extends SensorBase {
  constructor(
    platform: OmniLinkPlatform,
    platformAccessory: PlatformAccessory,   
  ) {
    super(platform, platformAccessory);

    this.service = this.platformAccessory.getService(this.platform.Service.LeakSensor) ??
      this.platformAccessory.addService(this.platform.Service.LeakSensor, this.serviceName);

    this.setEventHandlers();
  }

  static type = 'LeakSensor';

  get serviceName(): string {
    return this.platform.omniService.zones.get(this.platformAccessory.context.index)!.name
      ?? `${LeakSensor.type} ${this.platformAccessory.context.index}`;
  }

  setEventHandlers(): void {
    this.platform.log.debug(this.constructor.name, 'setEventHandlers');
    
    super.setEventHandlers();

    this.service
      .getCharacteristic(this.platform.Characteristic.LeakDetected)
      .on('get', this.getCharacteristicValue.bind(this, this.getLeakDetected.bind(this), 'LeakDetected'));

    this.platform.omniService.on(`zone-${this.platformAccessory.context.index}`, this.updateValues.bind(this));
  }

  private async getLeakDetected(): Promise<number> {
    this.platform.log.debug(this.constructor.name, 'getLeakDetected');

    const zoneStatus = await this.platform.omniService.getZoneStatus(this.platformAccessory.context.index);

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