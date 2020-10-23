import { PlatformAccessory } from 'homebridge';
import { OmniLinkPlatform } from '../platform';
import { AccessoryBase } from './AccessoryBase';
import { ZoneStatus } from '../models/ZoneStatus';

export class GarageDoorOpener extends AccessoryBase { 
  private zoneId?: number;
  private openTime: number;

  constructor(
    platform: OmniLinkPlatform,
    platformAccessory: PlatformAccessory,   
  ) {
    super(platform, platformAccessory);

    this.service = this.platformAccessory.getService(this.platform.Service.GarageDoorOpener) ??
      this.platformAccessory.addService(this.platform.Service.GarageDoorOpener, this.serviceName);

    this.zoneId = this.platform.settings.garageDoors.get(this.platformAccessory.context.index)?.zoneId;
    this.openTime = (this.platform.settings.garageDoors.get(this.platformAccessory.context.index)?.openTime ?? 10) * 1000 ;

    this.setEventHandlers();
  }

  static type = 'GarageDoorOpener';

  get serviceName(): string {
    return this.platform.omniService.buttons.get(this.platformAccessory.context.index)!.name
      ?? `${GarageDoorOpener.type} ${this.platformAccessory.context.index}`;
  }

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
      this.platform.omniService.on(`zone-${this.zoneId}`, this.updateValues.bind(this));
    }
  }

  async getCurrentDoorState(): Promise<number> {
    this.platform.log.debug(this.constructor.name, 'getCurrentDoorState');

    if (this.zoneId === undefined) {
      return this.platform.Characteristic.CurrentDoorState.CLOSED;
    }

    const zoneStatus = await this.platform.omniService.getZoneStatus(this.zoneId);

    return zoneStatus!.ready
      ? this.platform.Characteristic.CurrentDoorState.CLOSED
      : this.platform.Characteristic.CurrentDoorState.OPEN;
  }

  async getTargetDoorState(): Promise<number> {
    this.platform.log.debug(this.constructor.name, 'getTargetDoorState');

    if (this.zoneId === undefined) {
      return this.platform.Characteristic.TargetDoorState.CLOSED;
    }

    const zoneStatus = await this.platform.omniService.getZoneStatus(this.zoneId);

    return zoneStatus!.ready
      ? this.platform.Characteristic.TargetDoorState.CLOSED
      : this.platform.Characteristic.TargetDoorState.OPEN;
  }

  async setTargetDoorState(value: number): Promise<void> {
    this.platform.log.debug(this.constructor.name, 'setTargetDoorState', value);

    const targetDoorState = await this.getTargetDoorState();

    if (targetDoorState === value) {
      return;
    }

    await this.platform.omniService.executeButton(this.platformAccessory.context.index);
  }

  async getObstructionDetected(): Promise<boolean> {
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

        // Set current state to open after period of time
        setTimeout(() => {
          this.service
            .getCharacteristic(this.platform.Characteristic.CurrentDoorState)
            .updateValue(this.platform.Characteristic.CurrentDoorState.OPEN);
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