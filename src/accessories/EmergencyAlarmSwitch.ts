import { PlatformAccessory } from 'homebridge';
import { OmniLinkPlatform } from '../platform';
import { AccessoryBase } from './AccessoryBase';
import { EmergencyTypes } from '../omni/messages/enums';
import { AreaStatus, ArmedModes, Alarms } from '../models/AreaStatus';

export class EmergencyAlarmSwitch extends AccessoryBase {
  private areaId: number;
  private emergencyType: EmergencyTypes;

  constructor(
    platform: OmniLinkPlatform,
    platformAccessory: PlatformAccessory,   
  ) {
    super(platform, platformAccessory);

    this.areaId = (this.platformAccessory.context.index & 0xFF00) / 256;
    this.emergencyType = this.platformAccessory.context.index & 0xFF;

    this.service = this.platformAccessory.getService(this.platform.Service.Switch) ??
      this.platformAccessory.addService(this.platform.Service.Switch, this.serviceName);

    this.setEventHandlers();
  }

  static type = 'EmergencyAlarm';

  get serviceName(): string {
    return `${this.platform.omniService.areas.get(this.areaId)!.name} ${EmergencyTypes[this.emergencyType]}`
      ?? `${EmergencyAlarmSwitch.type} ${this.platformAccessory.context.index}`;
  }

  setEventHandlers(): void {
    this.platform.log.debug(this.constructor.name, 'setEventHandlers');
    
    this.service
      .getCharacteristic(this.platform.Characteristic.On)
      .on('get', this.getCharacteristicValue.bind(this, this.getEmergencyAlarmSwitchOn.bind(this), 'On'))
      .on('set', this.setCharacteristicValue.bind(this, this.setEmergencyAlarmSwitchOn.bind(this), 'On'));

    this.platform.omniService.on(`area-${this.areaId}`, this.updateValues.bind(this));
  }

  async getEmergencyAlarmSwitchOn(): Promise<boolean> {
    this.platform.log.debug(this.constructor.name, 'getEmergencyAlarmSwitchOn');

    const areaStatus = await this.platform.omniService.getAreaStatus(this.areaId);

    return areaStatus!.alarmsTriggered.includes(this.getAlarmMode(this.emergencyType));
  }

  async setEmergencyAlarmSwitchOn(value: boolean): Promise<void> {
    this.platform.log.debug(this.constructor.name, 'setEmergencyAlarmSwitchOn', value);

    if (value) {
      await this.platform.omniService.setEmergencyAlarm(this.areaId, this.emergencyType);
    } else {
      await this.platform.omniService.setAreaAlarmMode(this.areaId, ArmedModes.Disarmed);
    }
  }

  getAlarmMode(emergencyType: EmergencyTypes) {
    switch(emergencyType) {
      case EmergencyTypes.Burglary:
        return Alarms.Burglary;
      case EmergencyTypes.Fire:
        return Alarms.Fire;
      case EmergencyTypes.Auxiliary:
        return Alarms.Auxiliary;
    }
  }

  updateValues(areaStatus: AreaStatus): void {
    this.platform.log.debug(this.constructor.name, 'updateValues', areaStatus);

    this.service
      .getCharacteristic(this.platform.Characteristic.On)
      .updateValue(areaStatus!.alarmsTriggered.includes(this.getAlarmMode(this.emergencyType)));
  }
}