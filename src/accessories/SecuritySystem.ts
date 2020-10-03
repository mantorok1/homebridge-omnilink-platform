import { PlatformAccessory } from 'homebridge';
import { OmniLinkPlatform } from '../platform';
import { AccessoryBase } from './AccessoryBase';
import { AlarmModes, AreaStatus } from '../omni/OmniService';

export class SecuritySystem extends AccessoryBase {
  constructor(
    platform: OmniLinkPlatform,
    platformAccessory: PlatformAccessory,   
  ) {
    super(platform, platformAccessory);

    this.service = this.platformAccessory.getService(this.platform.Service.SecuritySystem) ??
      this.platformAccessory.addService(this.platform.Service.SecuritySystem, this.serviceName);

    this.setEventHandlers();
  }

  static type = 'SecuritySystem';

  get serviceName(): string {
    return this.platform.omniService.areas.get(this.platformAccessory.context.index)!.name
      ?? `${SecuritySystem.type} ${this.platformAccessory.context.index}`;
  }

  setEventHandlers(): void {
    this.platform.log.debug(this.constructor.name, 'setEventHandlers');
    
    this.service
      .getCharacteristic(this.platform.Characteristic.SecuritySystemCurrentState)
      .on('get', this.getCharacteristicValue.bind(this, this.getSecuritySystemCurrentState.bind(this), 'SecuritySystemCurrentState'));
  
    this.service
      .getCharacteristic(this.platform.Characteristic.SecuritySystemTargetState)
      .on('get', this.getCharacteristicValue.bind(this, this.getSecuritySystemTargetState.bind(this), 'SecuritySystemTargetState'))
      .on('set', this.setCharacteristicValue.bind(this, this.setSecuritySystemTargetState.bind(this), 'SecuritySystemTargetState'));
    
    this.platform.omniService.on(`area-${this.platformAccessory.context.index}`, this.updateValues.bind(this));
  }

  private async getSecuritySystemCurrentState(): Promise<number> {
    this.platform.log.debug(this.constructor.name, 'getSecuritySystemCurrentState');

    const areaStatus = await this.platform.omniService.getAreaStatus(this.platformAccessory.context.index);

    return this.getCurrentState(areaStatus!);
  }

  private getCurrentState(areaStatus: AreaStatus): number {
    this.platform.log.debug(this.constructor.name, 'getCurrentState', areaStatus);

    if (areaStatus!.burglaryTriggered) {
      return this.platform.Characteristic.SecuritySystemCurrentState.ALARM_TRIGGERED;
    }

    switch (areaStatus!.alarmMode) {
      case AlarmModes.ArmedDay:
        return this.platform.Characteristic.SecuritySystemCurrentState.STAY_ARM;
      case AlarmModes.ArmedNight:
        return this.platform.Characteristic.SecuritySystemCurrentState.NIGHT_ARM;
      case AlarmModes.ArmedAway:
        return this.platform.Characteristic.SecuritySystemCurrentState.AWAY_ARM;
      default:
        return this.platform.Characteristic.SecuritySystemCurrentState.DISARMED;
    }
  }

  private async getSecuritySystemTargetState(): Promise<number> {
    this.platform.log.debug(this.constructor.name, 'getSecuritySystemTargetState');

    const areaStatus = await this.platform.omniService.getAreaStatus(this.platformAccessory.context.index);

    switch (areaStatus!.alarmMode) {
      case AlarmModes.Disarmed:
        return this.platform.Characteristic.SecuritySystemTargetState.DISARM;
      case AlarmModes.ArmedDay:
        return this.platform.Characteristic.SecuritySystemTargetState.STAY_ARM;
      case AlarmModes.ArmedNight:
        return this.platform.Characteristic.SecuritySystemTargetState.NIGHT_ARM;
      default:
        return this.platform.Characteristic.SecuritySystemTargetState.AWAY_ARM;
    }
  }

  private getTargetState(areaStatus: AreaStatus): number {
    this.platform.log.debug(this.constructor.name, 'getTargetState', areaStatus);

    switch (areaStatus!.alarmMode) {
      case AlarmModes.Disarmed:
        return this.platform.Characteristic.SecuritySystemTargetState.DISARM;
      case AlarmModes.ArmedDay:
        return this.platform.Characteristic.SecuritySystemTargetState.STAY_ARM;
      case AlarmModes.ArmedNight:
        return this.platform.Characteristic.SecuritySystemTargetState.NIGHT_ARM;
      default:
        return this.platform.Characteristic.SecuritySystemTargetState.AWAY_ARM;
    }
  }

  private async setSecuritySystemTargetState(mode: number): Promise<void> {
    this.platform.log.debug(this.constructor.name, 'setSecuritySystemTargetState', mode);

    let alarmMode: AlarmModes = AlarmModes.Disarmed;
    switch (mode) {
      case this.platform.Characteristic.SecuritySystemTargetState.STAY_ARM:
        alarmMode = AlarmModes.ArmedDay;
        break;
      case this.platform.Characteristic.SecuritySystemTargetState.NIGHT_ARM:
        alarmMode = AlarmModes.ArmedNight;
        break;
      case this.platform.Characteristic.SecuritySystemTargetState.AWAY_ARM:
        alarmMode = AlarmModes.ArmedAway;
        break;
    }

    await this.platform.omniService.setAreaAlarmMode(this.platformAccessory.context.index, alarmMode);
  }

  private async updateValues(areaStatus: AreaStatus): Promise<void> {
    this.platform.log.debug(this.constructor.name, 'updateValues', areaStatus);

    if (this.platform.settings.setHomeToAway && areaStatus.alarmMode === AlarmModes.ArmedDay) {
      this.platform.log.warn('Changing alarm mode from "Home" to "Away"');
      this.setSecuritySystemTargetState(this.platform.Characteristic.SecuritySystemTargetState.AWAY_ARM);
    }

    if (this.platform.settings.setNightToAway && areaStatus.alarmMode === AlarmModes.ArmedNight) {
      this.platform.log.warn('Changing alarm mode from "Night" to "Away"');
      this.setSecuritySystemTargetState(this.platform.Characteristic.SecuritySystemTargetState.AWAY_ARM);
    }

    this.service
      .getCharacteristic(this.platform.Characteristic.SecuritySystemCurrentState)
      .updateValue(this.getCurrentState(areaStatus));

    this.service
      .getCharacteristic(this.platform.Characteristic.SecuritySystemTargetState)
      .updateValue(this.getTargetState(areaStatus));
  }
}