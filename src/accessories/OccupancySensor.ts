import { CharacteristicValue, PlatformAccessory } from 'homebridge';
import { OmniLinkPlatform } from '../platform';
import { SensorBase } from './SensorBase';
import { ZoneStatus } from '../models/Zone';
import { OmniObjectStatusTypes } from '../models/OmniObjectBase';

export class OccupancySensor extends SensorBase {
  constructor(
    platform: OmniLinkPlatform,
    platformAccessory: PlatformAccessory,   
  ) {
    super(platform, platformAccessory);

    this.service = this.platformAccessory.getService(this.platform.Service.OccupancySensor) ??
      this.platformAccessory.addService(this.platform.Service.OccupancySensor, platformAccessory.displayName);

    this.setEventHandlers();
  }

  static type = 'OccupancySensor';

  setEventHandlers(): void {
    this.platform.log.debug(this.constructor.name, 'setEventHandlers');
    
    super.setEventHandlers();

    this.service
      .getCharacteristic(this.platform.Characteristic.OccupancyDetected)
      .onGet(this.getCharacteristicValue.bind(this, this.getOccupancyDetected.bind(this), 'OccupancyDetected'));

    this.platform.omniService.on(this.platform.omniService.getEventKey(OmniObjectStatusTypes.Zone, this.platformAccessory.context.index),
      this.updateValues.bind(this));
  }

  private getOccupancyDetected(): CharacteristicValue {
    this.platform.log.debug(this.constructor.name, 'getOccupancyDetected');

    const zoneStatus = this.platform.omniService.omni.zones[this.platformAccessory.context.index].status;

    return zoneStatus!.ready
      ? this.platform.Characteristic.OccupancyDetected.OCCUPANCY_NOT_DETECTED
      : this.platform.Characteristic.OccupancyDetected.OCCUPANCY_DETECTED;
  }

  updateValues(zoneStatus: ZoneStatus): void {
    this.platform.log.debug(this.constructor.name, 'updateValues', zoneStatus);

    super.updateValues(zoneStatus);

    const occupancyDetected = zoneStatus!.ready
      ? this.platform.Characteristic.OccupancyDetected.OCCUPANCY_NOT_DETECTED
      : this.platform.Characteristic.OccupancyDetected.OCCUPANCY_DETECTED;

    this.service
      .getCharacteristic(this.platform.Characteristic.OccupancyDetected)
      .updateValue(occupancyDetected);
  }
}