import { CharacteristicValue, PlatformAccessory } from 'homebridge';
import { OmniLinkPlatform } from '../platform';
import { AccessoryBase } from './AccessoryBase';
import { EmergencyTypes } from '../omni/messages/enums';
import { AreaStatus, ArmedModes, Alarms } from '../models/Area';
import { OmniObjectStatusTypes } from '../models/OmniObjectBase';

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
      this.platformAccessory.addService(this.platform.Service.Switch, platformAccessory.displayName);

    this.setEventHandlers();
  }

  protected async identifyHandler(): Promise<void> {
    const state = this.getEmergencyAlarmSwitchOn();
    await this.setEmergencyAlarmSwitchOn(!state);
    super.identifyHandler();
  }

  static type = 'EmergencyAlarm';

  setEventHandlers(): void {
    this.platform.log.debug(this.constructor.name, 'setEventHandlers');
    
    this.service
      .getCharacteristic(this.platform.Characteristic.On)
      .onGet(this.getCharacteristicValue.bind(this, this.getEmergencyAlarmSwitchOn.bind(this), 'On'))
      .onSet(this.setCharacteristicValue.bind(this, this.setEmergencyAlarmSwitchOn.bind(this), 'On'));

    this.platform.omniService.on(this.platform.omniService.getEventKey(OmniObjectStatusTypes.Area, this.areaId),
      this.updateValues.bind(this));
  }

  private getEmergencyAlarmSwitchOn(): CharacteristicValue {
    this.platform.log.debug(this.constructor.name, 'getEmergencyAlarmSwitchOn');

    const areaStatus = this.platform.omniService.omni.areas[this.areaId].status;

    return areaStatus!.alarmsTriggered.includes(this.getAlarmMode(this.emergencyType));
  }

  private async setEmergencyAlarmSwitchOn(value: CharacteristicValue): Promise<void> {
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