import { PlatformAccessory } from 'homebridge';
import { OmniLinkPlatform } from '../platform';
import { SensorBase } from './SensorBase';
import { ZoneStatus } from '../models/ZoneStatus';

export class SmokeSensor extends SensorBase {
  constructor(
    platform: OmniLinkPlatform,
    platformAccessory: PlatformAccessory,   
  ) {
    super(platform, platformAccessory);

    this.service = this.platformAccessory.getService(this.platform.Service.SmokeSensor) ??
      this.platformAccessory.addService(this.platform.Service.SmokeSensor, platformAccessory.displayName);

    this.setEventHandlers();
  }

  static type = 'SmokeSensor';

  setEventHandlers(): void {
    this.platform.log.debug(this.constructor.name, 'setEventHandlers');
    
    super.setEventHandlers();

    this.service
      .getCharacteristic(this.platform.Characteristic.SmokeDetected)
      .on('get', this.getCharacteristicValue.bind(this, this.getSmokeDetected.bind(this), 'SmokeDetected'));

    this.platform.omniService.on(`zone-${this.platformAccessory.context.index}`, this.updateValues.bind(this));
  }

  private async getSmokeDetected(): Promise<number> {
    this.platform.log.debug(this.constructor.name, 'getSmokeDetected');

    const zoneStatus = await this.platform.omniService.getZoneStatus(this.platformAccessory.context.index);

    return zoneStatus!.ready
      ? this.platform.Characteristic.SmokeDetected.SMOKE_NOT_DETECTED
      : this.platform.Characteristic.SmokeDetected.SMOKE_DETECTED;
  }

  updateValues(zoneStatus: ZoneStatus): void {
    this.platform.log.debug(this.constructor.name, 'updateValues', zoneStatus);

    super.updateValues(zoneStatus);

    const smokeDetected = zoneStatus!.ready
      ? this.platform.Characteristic.SmokeDetected.SMOKE_NOT_DETECTED
      : this.platform.Characteristic.SmokeDetected.SMOKE_DETECTED;

    this.service
      .getCharacteristic(this.platform.Characteristic.SmokeDetected)
      .updateValue(smokeDetected);
  }
}