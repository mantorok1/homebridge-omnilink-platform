import { PlatformAccessory } from 'homebridge';
import { OmniLinkPlatform } from '../platform';
import { AccessoryBase } from './AccessoryBase';
import { AreaStatus, Alarms, ArmedModes } from '../models/Area';
import { OmniObjectStatusTypes } from '../models/OmniObjectBase';

export class SecuritySystem extends AccessoryBase {
  private faultDetected: boolean;
  
  constructor(
    platform: OmniLinkPlatform,
    platformAccessory: PlatformAccessory,   
  ) {
    super(platform, platformAccessory);

    this.faultDetected = false;

    this.service = this.platformAccessory.getService(this.platform.Service.SecuritySystem) ??
      this.platformAccessory.addService(this.platform.Service.SecuritySystem, platformAccessory.displayName);

    this.setEventHandlers();
  }

  static type = 'SecuritySystem';

  setEventHandlers(): void {
    this.platform.log.debug(this.constructor.name, 'setEventHandlers');
    
    this.service
      .getCharacteristic(this.platform.Characteristic.SecuritySystemCurrentState)
      .on('get', this.getCharacteristicValue.bind(this, this.getSecuritySystemCurrentState.bind(this), 'SecuritySystemCurrentState'));
  
    this.service
      .getCharacteristic(this.platform.Characteristic.SecuritySystemTargetState)
      .on('get', this.getCharacteristicValue.bind(this, this.getSecuritySystemTargetState.bind(this), 'SecuritySystemTargetState'))
      .on('set', this.setCharacteristicValue.bind(this, this.setSecuritySystemTargetState.bind(this), 'SecuritySystemTargetState'));

    this.service
      .getCharacteristic(this.platform.Characteristic.StatusFault)
      .on('get', this.getCharacteristicValue.bind(this, this.getStatusFault.bind(this), 'StatusFault'));
    
    this.platform.omniService.on(this.platform.omniService.getEventKey(OmniObjectStatusTypes.Area, this.platformAccessory.context.index),
      this.updateValues.bind(this));

    this.platform.omniService.on('system-troubles', this.updateStatusFault.bind(this));
  }

  private getSecuritySystemCurrentState(): number {
    this.platform.log.debug(this.constructor.name, 'getSecuritySystemCurrentState');

    const areaStatus = this.platform.omniService.omni.areas[this.platformAccessory.context.index].status;

    return this.getCurrentState(areaStatus!);
  }

  private getCurrentState(areaStatus: AreaStatus): number {
    this.platform.log.debug(this.constructor.name, 'getCurrentState', areaStatus);

    if (areaStatus.alarmsTriggered.includes(Alarms.Burglary)) {
      return this.platform.Characteristic.SecuritySystemCurrentState.ALARM_TRIGGERED;
    }

    switch (areaStatus!.armedMode) {
      case ArmedModes.ArmedDay:
        return this.platform.Characteristic.SecuritySystemCurrentState.STAY_ARM;
      case ArmedModes.ArmedNight:
        return this.platform.Characteristic.SecuritySystemCurrentState.NIGHT_ARM;
      case ArmedModes.ArmedAway:
        return this.platform.Characteristic.SecuritySystemCurrentState.AWAY_ARM;
      default:
        return this.platform.Characteristic.SecuritySystemCurrentState.DISARMED;
    }
  }

  private getSecuritySystemTargetState(): number {
    this.platform.log.debug(this.constructor.name, 'getSecuritySystemTargetState');

    const areaStatus = this.platform.omniService.omni.areas[this.platformAccessory.context.index].status;

    return this.getTargetState(areaStatus!);
  }

  private getTargetState(areaStatus: AreaStatus): number {
    this.platform.log.debug(this.constructor.name, 'getTargetState', areaStatus);

    switch (areaStatus.armedMode) {
      case ArmedModes.Disarmed:
        return this.platform.Characteristic.SecuritySystemTargetState.DISARM;
      case ArmedModes.ArmedDay:
        return this.platform.Characteristic.SecuritySystemTargetState.STAY_ARM;
      case ArmedModes.ArmedNight:
        return this.platform.Characteristic.SecuritySystemTargetState.NIGHT_ARM;
      default:
        return this.platform.Characteristic.SecuritySystemTargetState.AWAY_ARM;
    }
  }

  private async setSecuritySystemTargetState(value: number): Promise<void> {
    this.platform.log.debug(this.constructor.name, 'setSecuritySystemTargetState', value);

    const securitySystemTargetState = await this.getSecuritySystemTargetState();

    if (securitySystemTargetState === value) {
      return;
    }

    let alarmMode: ArmedModes = ArmedModes.Disarmed;
    switch (value) {
      case this.platform.Characteristic.SecuritySystemTargetState.STAY_ARM:
        alarmMode = ArmedModes.ArmedDay;
        break;
      case this.platform.Characteristic.SecuritySystemTargetState.NIGHT_ARM:
        alarmMode = ArmedModes.ArmedNight;
        break;
      case this.platform.Characteristic.SecuritySystemTargetState.AWAY_ARM:
        alarmMode = ArmedModes.ArmedAway;
        break;
    }

    await this.platform.omniService.setAreaAlarmMode(this.platformAccessory.context.index, alarmMode);
  }

  private getStatusFault(): number {
    this.platform.log.debug(this.constructor.name, 'getStatusFault');

    return this.faultDetected
      ? this.platform.Characteristic.StatusFault.GENERAL_FAULT
      : this.platform.Characteristic.StatusFault.NO_FAULT;
  }

  private updateValues(areaStatus: AreaStatus): void {
    this.platform.log.debug(this.constructor.name, 'updateValues', areaStatus);

    if (this.platform.settings.setHomeToAway && areaStatus.armedMode === ArmedModes.ArmedDay) {
      this.platform.log.warn(`${this.platformAccessory.displayName}: Changing alarm mode from "Home" to "Away"`);
      this.setSecuritySystemTargetState(this.platform.Characteristic.SecuritySystemTargetState.AWAY_ARM);
    }

    if (this.platform.settings.setNightToAway && areaStatus.armedMode === ArmedModes.ArmedNight) {
      this.platform.log.warn(`${this.platformAccessory.displayName}: Changing alarm mode from "Night" to "Away"`);
      this.setSecuritySystemTargetState(this.platform.Characteristic.SecuritySystemTargetState.AWAY_ARM);
    }

    this.service
      .getCharacteristic(this.platform.Characteristic.SecuritySystemCurrentState)
      .updateValue(this.getCurrentState(areaStatus));

    this.service
      .getCharacteristic(this.platform.Characteristic.SecuritySystemTargetState)
      .updateValue(this.getTargetState(areaStatus));
  }

  private updateStatusFault(troubles: number[]): void {
    this.platform.log.debug(this.constructor.name, 'updateStatusFault', troubles);

    this.faultDetected = troubles.length > 0;

    const statusFault = this.faultDetected
      ? this.platform.Characteristic.StatusFault.GENERAL_FAULT
      : this.platform.Characteristic.StatusFault.NO_FAULT;

    this.service
      .getCharacteristic(this.platform.Characteristic.StatusFault)
      .updateValue(statusFault);
  }
}