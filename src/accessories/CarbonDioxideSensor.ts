import { PlatformAccessory } from 'homebridge';
import { OmniLinkPlatform } from '../platform';
import { SensorBase } from './SensorBase';
import { ZoneStatus } from '../omni/OmniService';

export class CarbonDioxideSensor extends SensorBase {
  constructor(
    platform: OmniLinkPlatform,
    platformAccessory: PlatformAccessory,   
  ) {
    super(platform, platformAccessory);

    this.service = this.platformAccessory.getService(this.platform.Service.CarbonDioxideSensor) ??
      this.platformAccessory.addService(this.platform.Service.CarbonDioxideSensor, this.serviceName);

    this.setEventHandlers();
  }

  static type = 'CarbonDioxideSensor';

  get serviceName(): string {
    return this.platform.omniService.zones.get(this.platformAccessory.context.index)!.name
      ?? `${CarbonDioxideSensor.type} ${this.platformAccessory.context.index}`;
  }

  setEventHandlers(): void {
    this.platform.log.debug(this.constructor.name, 'setEventHandlers');
    
    super.setEventHandlers();

    this.service
      .getCharacteristic(this.platform.Characteristic.CarbonDioxideDetected)
      .on('get', this.getCharacteristicValue.bind(this, this.getCarbonDioxideDetected.bind(this), 'CarbonDioxideDetected'));

    this.platform.omniService.on(`zone-${this.platformAccessory.context.index}`, this.updateValues.bind(this));
  }

  private async getCarbonDioxideDetected(): Promise<number> {
    this.platform.log.debug(this.constructor.name, 'getCarbonDioxideDetected');

    const zoneStatus = await this.platform.omniService.getZoneStatus(this.platformAccessory.context.index);

    return zoneStatus!.ready
      ? this.platform.Characteristic.CarbonDioxideDetected.CO2_LEVELS_NORMAL
      : this.platform.Characteristic.CarbonDioxideDetected.CO2_LEVELS_ABNORMAL;
  }

  updateValues(zoneStatus: ZoneStatus): void {
    this.platform.log.debug(this.constructor.name, 'updateValues', zoneStatus);

    super.updateValues(zoneStatus);

    const carbonDioxideDetected = zoneStatus!.ready
      ? this.platform.Characteristic.CarbonDioxideDetected.CO2_LEVELS_NORMAL
      : this.platform.Characteristic.CarbonDioxideDetected.CO2_LEVELS_ABNORMAL;

    this.service
      .getCharacteristic(this.platform.Characteristic.CarbonDioxideDetected)
      .updateValue(carbonDioxideDetected);
  }
}