import { AccessoryBase } from './AccessoryBase';
import { ZoneStatus } from '../models/Zone';
import { CharacteristicValue } from 'homebridge';

export abstract class SensorBase extends AccessoryBase {

  setEventHandlers(): void {
    this.platform.log.debug('SensorBase', 'setEventHandlers');
    
    this.service
      .getCharacteristic(this.platform.Characteristic.StatusFault)
      .onGet(this.getCharacteristicValue.bind(this, this.getStatusFault.bind(this), 'StatusFault'));
  }

  private getStatusFault(): CharacteristicValue {
    this.platform.log.debug('SensorBase', 'getStatusFault');

    const zoneStatus = this.platform.omniService.omni.zones[this.platformAccessory.context.index].status;

    return zoneStatus!.trouble
      ? this.platform.Characteristic.StatusFault.GENERAL_FAULT
      : this.platform.Characteristic.StatusFault.NO_FAULT;
  }

  updateValues(zoneStatus: ZoneStatus): void {
    this.platform.log.debug('SensorBase', 'updateValues', zoneStatus);

    const fault = zoneStatus!.trouble
      ? this.platform.Characteristic.StatusFault.GENERAL_FAULT
      : this.platform.Characteristic.StatusFault.NO_FAULT;

    this.service
      .getCharacteristic(this.platform.Characteristic.StatusFault)
      .updateValue(fault);
  }
}