import { PlatformAccessory } from 'homebridge';
import { OmniLinkPlatform } from '../platform';
import { AccessoryBase } from './AccessoryBase';
import { ZoneStatus } from '../models/Zone';
import { OmniObjectStatusTypes } from '../models/OmniObjectBase';

export class GarageDoorOpener extends AccessoryBase { 
  private zoneId?: number;
  private openTime: number;
  private moving = false;

  constructor(
    platform: OmniLinkPlatform,
    platformAccessory: PlatformAccessory,   
  ) {
    super(platform, platformAccessory);

    this.service = this.platformAccessory.getService(this.platform.Service.GarageDoorOpener) ??
      this.platformAccessory.addService(this.platform.Service.GarageDoorOpener, platformAccessory.displayName);

    this.zoneId = this.platform.settings.garageDoors.get(this.platformAccessory.context.index)?.zoneId;
    this.openTime = (this.platform.settings.garageDoors.get(this.platformAccessory.context.index)?.openTime ?? 10) * 1000 ;

    this.setEventHandlers();
  }

  protected async identifyHandler(): Promise<void> {
    const state = await this.getTargetDoorState();
    if (state === this.platform.Characteristic.TargetDoorState.CLOSED) {
      await this.setTargetDoorState(this.platform.Characteristic.TargetDoorState.OPEN);
    } else {
      await this.setTargetDoorState(this.platform.Characteristic.TargetDoorState.CLOSED);
    }
    super.identifyHandler();
  }

  static type = 'GarageDoorOpener';

  setEventHandlers(): void {
    this.platform.log.debug(this.constructor.name, 'setEventHandlers');
    
    this.service
      .getCharacteristic(this.platform.Characteristic.CurrentDoorState)
      .on('get', this.getCharacteristicValue.bind(this, this.getCurrentDoorState.bind(this), 'CurrentDoorState'));

    this.service
      .getCharacteristic(this.platform.Characteristic.TargetDoorState)
      .on('get', this.getCharacteristicValue.bind(this, this.getTargetDoorState.bind(this), 'TargetDoorState'))
      .on('set', this.setCharacteristicValue.bind(this, this.setTargetDoorState.bind(this), 'TargetDoorState'));

    this.service
      .getCharacteristic(this.platform.Characteristic.ObstructionDetected)
      .on('get', this.getCharacteristicValue.bind(this, this.getObstructionDetected.bind(this), 'ObstructionDetected'));

    if (this.zoneId !== undefined) {
      this.platform.omniService.on(this.platform.omniService.getEventKey(OmniObjectStatusTypes.Zone, this.zoneId),
        this.updateValues.bind(this));
    }
  }

  private getCurrentDoorState(): number {
    this.platform.log.debug(this.constructor.name, 'getCurrentDoorState');

    if (this.zoneId === undefined) {
      return this.platform.Characteristic.CurrentDoorState.CLOSED;
    }

    const zoneStatus = this.platform.omniService.omni.zones[this.zoneId].status;

    return zoneStatus!.ready
      ? this.platform.Characteristic.CurrentDoorState.CLOSED
      : this.platform.Characteristic.CurrentDoorState.OPEN;
  }

  private getTargetDoorState(): number {
    this.platform.log.debug(this.constructor.name, 'getTargetDoorState');

    if (this.zoneId === undefined) {
      return this.platform.Characteristic.TargetDoorState.CLOSED;
    }

    const zoneStatus = this.platform.omniService.omni.zones[this.zoneId].status;

    return zoneStatus!.ready
      ? this.platform.Characteristic.TargetDoorState.CLOSED
      : this.platform.Characteristic.TargetDoorState.OPEN;
  }

  private async setTargetDoorState(value: number): Promise<void> {
    this.platform.log.debug(this.constructor.name, 'setTargetDoorState', value);

    const targetDoorState = this.getTargetDoorState();

    if (targetDoorState === value || this.moving) {
      return;
    }

    this.moving = true;

    await this.platform.omniService.executeButton(this.platformAccessory.context.index);

    setTimeout(() => {
      this.moving = false;
    }, this.openTime);
  }

  private getObstructionDetected(): boolean {
    this.platform.log.debug(this.constructor.name, 'getObstructionDetected');

    return false;
  }

  updateValues(zoneStatus: ZoneStatus): void {
    this.platform.log.debug(this.constructor.name, 'updateValues');

    // Current State
    let currentDoorState = this.service
      .getCharacteristic(this.platform.Characteristic.CurrentDoorState)
      .value;

    if (zoneStatus!.ready) {
      currentDoorState = this.platform.Characteristic.CurrentDoorState.CLOSED;
    } else {
      if (currentDoorState === this.platform.Characteristic.CurrentDoorState.CLOSED) {
        currentDoorState = this.platform.Characteristic.CurrentDoorState.OPENING;
        this.moving = true;

        // Set current state to open after period of time
        setTimeout(() => {
          this.service
            .getCharacteristic(this.platform.Characteristic.CurrentDoorState)
            .updateValue(this.platform.Characteristic.CurrentDoorState.OPEN);
          this.moving = false;
        }, this.openTime);
      }
    }

    this.service
      .getCharacteristic(this.platform.Characteristic.CurrentDoorState)
      .updateValue(currentDoorState);

    // Target State
    const targetDoorState = zoneStatus!.ready
      ? this.platform.Characteristic.TargetDoorState.CLOSED
      : this.platform.Characteristic.TargetDoorState.OPEN;

    this.service
      .getCharacteristic(this.platform.Characteristic.TargetDoorState)
      .updateValue(targetDoorState);
  }
}