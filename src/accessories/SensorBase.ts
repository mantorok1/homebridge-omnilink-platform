import { AccessoryBase } from './AccessoryBase';
import { ZoneStatus } from '../models/ZoneStatus';

export abstract class SensorBase extends AccessoryBase {

  setEventHandlers(): void {
    this.platform.log.debug('SensorBase', 'setEventHandlers');
    
    this.service
      .getCharacteristic(this.platform.Characteristic.StatusFault)
      .on('get', this.getCharacteristicValue.bind(this, this.getStatusFault.bind(this), 'StatusFault'));
  }

  private async getStatusFault(): Promise<number> {
    this.platform.log.debug('SensorBase', 'getStatusFault');

    const zoneStatus = await this.platform.omniService.getZoneStatus(this.platformAccessory.context.index);

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