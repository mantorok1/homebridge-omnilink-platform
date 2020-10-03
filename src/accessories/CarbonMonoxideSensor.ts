import { PlatformAccessory } from 'homebridge';
import { OmniLinkPlatform } from '../platform';
import { SensorBase } from './SensorBase';
import { ZoneStatus } from '../omni/OmniService';

export class CarbonMonoxideSensor extends SensorBase {
  constructor(
    platform: OmniLinkPlatform,
    platformAccessory: PlatformAccessory,   
  ) {
    super(platform, platformAccessory);

    this.service = this.platformAccessory.getService(this.platform.Service.CarbonMonoxideSensor) ??
      this.platformAccessory.addService(this.platform.Service.CarbonMonoxideSensor, this.serviceName);

    this.setEventHandlers();
  }

  static type = 'CarbonMonoxideSensor';

  get serviceName(): string {
    return this.platform.omniService.zones.get(this.platformAccessory.context.index)!.name
      ?? `${CarbonMonoxideSensor.type} ${this.platformAccessory.context.index}`;
  }

  setEventHandlers(): void {
    this.platform.log.debug(this.constructor.name, 'setEventHandlers');
    
    super.setEventHandlers();

    this.service
      .getCharacteristic(this.platform.Characteristic.CarbonMonoxideDetected)
      .on('get', this.getCharacteristicValue.bind(this, this.getCarbonMonoxideDetected.bind(this), 'CarbonMonoxideDetected'));

    this.platform.omniService.on(`zone-${this.platformAccessory.context.index}`, this.updateValues.bind(this));
  }

  private async getCarbonMonoxideDetected(): Promise<number> {
    this.platform.log.debug(this.constructor.name, 'getCarbonMonoxideDetected');

    const zoneStatus = await this.platform.omniService.getZoneStatus(this.platformAccessory.context.index);

    return zoneStatus!.ready
      ? this.platform.Characteristic.CarbonMonoxideDetected.CO_LEVELS_NORMAL
      : this.platform.Characteristic.CarbonMonoxideDetected.CO_LEVELS_ABNORMAL;
  }

  updateValues(zoneStatus: ZoneStatus): void {
    this.platform.log.debug(this.constructor.name, 'updateValues', zoneStatus);

    super.updateValues(zoneStatus);

    const carbonMonoxideDetected = zoneStatus!.ready
      ? this.platform.Characteristic.CarbonMonoxideDetected.CO_LEVELS_NORMAL
      : this.platform.Characteristic.CarbonMonoxideDetected.CO_LEVELS_ABNORMAL;

    this.service
      .getCharacteristic(this.platform.Characteristic.CarbonMonoxideDetected)
      .updateValue(carbonMonoxideDetected);
  }
}