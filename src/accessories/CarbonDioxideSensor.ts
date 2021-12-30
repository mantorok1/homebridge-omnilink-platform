import { CharacteristicValue, PlatformAccessory } from 'homebridge';
import { OmniLinkPlatform } from '../platform';
import { SensorBase } from './SensorBase';
import { ZoneStatus } from '../models/Zone';
import { OmniObjectStatusTypes } from '../models/OmniObjectBase';

export class CarbonDioxideSensor extends SensorBase {
  constructor(
    platform: OmniLinkPlatform,
    platformAccessory: PlatformAccessory,   
  ) {
    super(platform, platformAccessory);

    this.service = this.platformAccessory.getService(this.platform.Service.CarbonDioxideSensor) ??
      this.platformAccessory.addService(this.platform.Service.CarbonDioxideSensor, platformAccessory.displayName);

    this.setEventHandlers();
  }

  static type = 'CarbonDioxideSensor';

  setEventHandlers(): void {
    this.platform.log.debug(this.constructor.name, 'setEventHandlers');
    
    super.setEventHandlers();

    this.service
      .getCharacteristic(this.platform.Characteristic.CarbonDioxideDetected)
      .onGet(this.getCharacteristicValue.bind(this, this.getCarbonDioxideDetected.bind(this), 'CarbonDioxideDetected'));

    this.platform.omniService.on(this.platform.omniService.getEventKey(OmniObjectStatusTypes.Zone, this.platformAccessory.context.index),
      this.updateValues.bind(this));
  }

  private getCarbonDioxideDetected(): CharacteristicValue {
    this.platform.log.debug(this.constructor.name, 'getCarbonDioxideDetected');

    const zoneStatus = this.platform.omniService.omni.zones[this.platformAccessory.context.index].status;

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