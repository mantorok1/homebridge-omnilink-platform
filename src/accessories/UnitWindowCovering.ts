import { CharacteristicValue, PlatformAccessory } from 'homebridge';
import { OmniLinkPlatform } from '../platform';
import { AccessoryBase } from './AccessoryBase';
import { UnitStatus } from '../models/Unit';
import { OmniObjectStatusTypes } from '../models/OmniObjectBase';

export class UnitWindowCovering extends AccessoryBase {
  private targetPosition: number;

  constructor(
    platform: OmniLinkPlatform,
    platformAccessory: PlatformAccessory,   
  ) {
    super(platform, platformAccessory);

    this.targetPosition = this.platform.omniService.omni.units[this.platformAccessory.context.index].status.brightness;

    this.service = this.platformAccessory.getService(this.platform.Service.WindowCovering) ??
      this.platformAccessory.addService(this.platform.Service.WindowCovering, platformAccessory.displayName);

    this.setEventHandlers();
  }

  static type = 'UnitWindowCovering';

  setEventHandlers(): void {
    this.platform.log.debug(this.constructor.name, 'setEventHandlers');

    this.service
      .getCharacteristic(this.platform.Characteristic.CurrentPosition)
      .onGet(this.getCharacteristicValue.bind(this, this.getUnitWindowCoveringCurrentPosition.bind(this), 'CurrentPosition'));

    this.service
      .getCharacteristic(this.platform.Characteristic.PositionState)
      .onGet(this.getCharacteristicValue.bind(this, this.getUnitWindowCoveringPositionState.bind(this), 'PositionState'));

    this.service
      .getCharacteristic(this.platform.Characteristic.TargetPosition)
      .onGet(this.getCharacteristicValue.bind(this, this.getUnitWindowCoveringTargetPosition.bind(this), 'TargetPosition'))
      .onSet(this.setCharacteristicValue.bind(this, this.setUnitWindowCoveringTargetPosition.bind(this), 'TargetPosition'));

    this.platform.omniService.on(this.platform.omniService.getEventKey(OmniObjectStatusTypes.Unit, this.platformAccessory.context.index),
      this.updateValues.bind(this));
  }

  private getUnitWindowCoveringCurrentPosition(): CharacteristicValue {
    this.platform.log.debug(this.constructor.name, 'getUnitWindowCoveringCurrentPosition');

    return this.platform.omniService.omni.units[this.platformAccessory.context.index].status.brightness;
  }

  private getUnitWindowCoveringPositionState(): CharacteristicValue {
    this.platform.log.debug(this.constructor.name, 'getUnitWindowCoveringPositionState');

    return this.calculatePositionState(
      this.platform.omniService.omni.units[this.platformAccessory.context.index].status.brightness);
  }

  private calculatePositionState(currentPosition: number): CharacteristicValue {
    if (this.targetPosition === currentPosition) {
      return this.platform.Characteristic.PositionState.STOPPED;
    }
    if (this.targetPosition > currentPosition) {
      return this.platform.Characteristic.PositionState.INCREASING;
    }
    return this.platform.Characteristic.PositionState.DECREASING;
  }

  private getUnitWindowCoveringTargetPosition(): CharacteristicValue {
    this.platform.log.debug(this.constructor.name, 'getUnitWindowCoveringTargetPosition');

    return this.targetPosition;
  }

  private async setUnitWindowCoveringTargetPosition(value: CharacteristicValue): Promise<void> {
    this.platform.log.debug(this.constructor.name, 'setUnitWindowCoveringTargetPosition', value);

    this.targetPosition = value as number;
    if (this.getUnitWindowCoveringCurrentPosition() === value) {
      return;
    }

    await this.platform.omniService.setUnitBrightness(this.platformAccessory.context.index, value as number);
  }

  updateValues(status: UnitStatus): void {
    this.platform.log.debug(this.constructor.name, 'updateValues', status);

    this.service
      .getCharacteristic(this.platform.Characteristic.CurrentPosition)
      .updateValue(status.brightness);

    this.service
      .getCharacteristic(this.platform.Characteristic.PositionState)
      .updateValue(this.calculatePositionState(status.brightness));

    this.service
      .getCharacteristic(this.platform.Characteristic.TargetPosition)
      .updateValue(this.targetPosition);
  }
}