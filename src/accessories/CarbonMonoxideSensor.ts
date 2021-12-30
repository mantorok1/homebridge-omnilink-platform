import { CharacteristicValue, PlatformAccessory } from 'homebridge';
import { OmniLinkPlatform } from '../platform';
import { SensorBase } from './SensorBase';
import { ZoneStatus } from '../models/Zone';
import { OmniObjectStatusTypes } from '../models/OmniObjectBase';

export class CarbonMonoxideSensor extends SensorBase {
  constructor(
    platform: OmniLinkPlatform,
    platformAccessory: PlatformAccessory,   
  ) {
    super(platform, platformAccessory);

    this.service = this.platformAccessory.getService(this.platform.Service.CarbonMonoxideSensor) ??
      this.platformAccessory.addService(this.platform.Service.CarbonMonoxideSensor, platformAccessory.displayName);

    this.setEventHandlers();
  }

  static type = 'CarbonMonoxideSensor';

  setEventHandlers(): void {
    this.platform.log.debug(this.constructor.name, 'setEventHandlers');
    
    super.setEventHandlers();

    this.service
      .getCharacteristic(this.platform.Characteristic.CarbonMonoxideDetected)
      .onGet(this.getCharacteristicValue.bind(this, this.getCarbonMonoxideDetected.bind(this), 'CarbonMonoxideDetected'));

    this.platform.omniService.on(this.platform.omniService.getEventKey(OmniObjectStatusTypes.Zone, this.platformAccessory.context.index),
      this.updateValues.bind(this));
  }

  private getCarbonMonoxideDetected(): CharacteristicValue {
    this.platform.log.debug(this.constructor.name, 'getCarbonMonoxideDetected');

    const zoneStatus = this.platform.omniService.omni.zones[this.platformAccessory.context.index].status;

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