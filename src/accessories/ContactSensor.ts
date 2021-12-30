import { CharacteristicValue, PlatformAccessory } from 'homebridge';
import { OmniLinkPlatform } from '../platform';
import { SensorBase } from './SensorBase';
import { ZoneStatus } from '../models/Zone';
import { OmniObjectStatusTypes } from '../models/OmniObjectBase';

export class ContactSensor extends SensorBase {
  constructor(
    platform: OmniLinkPlatform,
    platformAccessory: PlatformAccessory,   
  ) {
    super(platform, platformAccessory);

    this.service = this.platformAccessory.getService(this.platform.Service.ContactSensor) ??
      this.platformAccessory.addService(this.platform.Service.ContactSensor, platformAccessory.displayName);

    this.setEventHandlers();
  }

  static type = 'ContactSensor';

  setEventHandlers(): void {
    this.platform.log.debug(this.constructor.name, 'setEventHandlers');
    
    super.setEventHandlers();

    this.service
      .getCharacteristic(this.platform.Characteristic.ContactSensorState)
      .onGet(this.getCharacteristicValue.bind(this, this.getContactSensorState.bind(this), 'ContactSensorState'));

    this.platform.omniService.on(this.platform.omniService.getEventKey(OmniObjectStatusTypes.Zone, this.platformAccessory.context.index),
      this.updateValues.bind(this));
  }

  private getContactSensorState(): CharacteristicValue {
    this.platform.log.debug(this.constructor.name, 'getContactSensorState');

    const zoneStatus = this.platform.omniService.omni.zones[this.platformAccessory.context.index].status;

    return zoneStatus!.ready
      ? this.platform.Characteristic.ContactSensorState.CONTACT_DETECTED
      : this.platform.Characteristic.ContactSensorState.CONTACT_NOT_DETECTED;
  }

  updateValues(zoneStatus: ZoneStatus): void {
    this.platform.log.debug(this.constructor.name, 'updateValues', zoneStatus);

    super.updateValues(zoneStatus);

    const contactSensorState = zoneStatus!.ready
      ? this.platform.Characteristic.ContactSensorState.CONTACT_DETECTED
      : this.platform.Characteristic.ContactSensorState.CONTACT_NOT_DETECTED;

    this.service
      .getCharacteristic(this.platform.Characteristic.ContactSensorState)
      .updateValue(contactSensorState);
  }
}