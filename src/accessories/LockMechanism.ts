import { PlatformAccessory } from 'homebridge';
import { OmniLinkPlatform } from '../platform';
import { AccessoryBase } from './AccessoryBase';
import { AccessControlLockStatus } from '../models/AccessControlLockStatus';

export class LockMechanism extends AccessoryBase {
  constructor(
    platform: OmniLinkPlatform,
    platformAccessory: PlatformAccessory,   
  ) {
    super(platform, platformAccessory);

    this.service = this.platformAccessory.getService(this.platform.Service.LockMechanism) ??
      this.platformAccessory.addService(this.platform.Service.LockMechanism, platformAccessory.displayName);

    this.setEventHandlers();
  }

  protected async identifyHandler(): Promise<void> {
    const state = await this.getLockTargetState();
    await this.setLockTargetState(state === this.platform.Characteristic.LockTargetState.SECURED
      ? this.platform.Characteristic.LockTargetState.UNSECURED
      : this.platform.Characteristic.LockTargetState.SECURED);
    super.identifyHandler();
  }

  static type = 'LockMechanism';

  setEventHandlers(): void {
    this.platform.log.debug(this.constructor.name, 'setEventHandlers');
    
    this.service
      .getCharacteristic(this.platform.Characteristic.LockCurrentState)
      .on('get', this.getCharacteristicValue.bind(this, this.getLockCurrentState.bind(this), 'LockCurrentState'));

    this.service
      .getCharacteristic(this.platform.Characteristic.LockTargetState)
      .on('get', this.getCharacteristicValue.bind(this, this.getLockTargetState.bind(this), 'LockTargetState'))
      .on('set', this.setCharacteristicValue.bind(this, this.setLockTargetState.bind(this), 'LockTargetState'));  

    this.platform.omniService.on(`lock-${this.platformAccessory.context.index}`, this.updateValues.bind(this));
  }

  async getLockCurrentState(): Promise<number> {
    this.platform.log.debug(this.constructor.name, 'getLockCurrentState');

    const lockStatus = await this.platform.omniService.getLockStatus(this.platformAccessory.context.index);

    return lockStatus!.locked
      ? this.platform.Characteristic.LockCurrentState.SECURED
      : this.platform.Characteristic.LockCurrentState.UNSECURED;
  }

  async getLockTargetState(): Promise<number> {
    this.platform.log.debug(this.constructor.name, 'getLockTargetState');

    const lockStatus = await this.platform.omniService.getLockStatus(this.platformAccessory.context.index);

    return lockStatus!.locked
      ? this.platform.Characteristic.LockTargetState.SECURED
      : this.platform.Characteristic.LockTargetState.UNSECURED;
  }

  async setLockTargetState(value: number): Promise<void> {
    this.platform.log.debug(this.constructor.name, 'setLockTargetState', value);

    const lock = value === this.platform.Characteristic.LockCurrentState.SECURED;

    await this.platform.omniService.setLockState(this.platformAccessory.context.index, lock);
  }

  updateValues(lockStatus: AccessControlLockStatus): void {
    this.platform.log.debug(this.constructor.name, 'updateValues', lockStatus);

    this.service
      .getCharacteristic(this.platform.Characteristic.LockCurrentState)
      .updateValue(lockStatus.locked
        ? this.platform.Characteristic.LockCurrentState.SECURED
        : this.platform.Characteristic.LockCurrentState.UNSECURED);

    this.service
      .getCharacteristic(this.platform.Characteristic.LockTargetState)
      .updateValue(lockStatus.locked
        ? this.platform.Characteristic.LockTargetState.SECURED
        : this.platform.Characteristic.LockTargetState.UNSECURED);
  }
}