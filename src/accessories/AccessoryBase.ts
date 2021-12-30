import crypto = require('crypto');

import { Service, PlatformAccessory, CharacteristicValue, Nullable } from 'homebridge';
import { OmniLinkPlatform } from '../platform';

export abstract class AccessoryBase {
  protected service!: Service;
  
  constructor(
    protected readonly platform: OmniLinkPlatform,
    public readonly platformAccessory: PlatformAccessory,
  ) { 
    this.setAccessoryInformation();

    this.platformAccessory.on('identify', this.identifyHandler.bind(this));
  }

  protected async identifyHandler(): Promise<void> {
    this.platform.log.info(`Identified: ${this.platformAccessory.displayName}`);
  }

  setAccessoryInformation(): void {
    this.platform.log.debug('AccessoryBase', 'setAccessoryInformation');

    const service = <Service>this.platformAccessory.getService(this.platform.Service.AccessoryInformation);
    service
      .setCharacteristic(this.platform.Characteristic.Manufacturer, 'Leviton')
      .setCharacteristic(this.platform.Characteristic.Model, 'Omni')
      .setCharacteristic(this.platform.Characteristic.SerialNumber,
        crypto.createHash('sha1').update(this.platformAccessory.UUID).digest('hex'));
  }

  abstract setEventHandlers(): void

  getCharacteristicValue(
    getValue: () => CharacteristicValue,
    characteristic: string,
  ): Nullable<CharacteristicValue> | Promise<Nullable<CharacteristicValue>> {
    this.platform.log.debug('AccessoryBase', 'getCharacteristicValue', 'getValue', characteristic);

    if (this.platform.settings.showHomebridgeEvents) {
      this.platform.log.info(`${this.platformAccessory.displayName}: Getting characteristic '${characteristic}'`);
    }

    try {
      return getValue();
    } catch (error) {
      if (error instanceof Error) {
        this.platform.log.error(error.message);
      }
      throw error;
    }
  }

  async setCharacteristicValue(
    setValue: (value: CharacteristicValue) => Promise<void>,
    characteristic: string,
    value: CharacteristicValue,
  ): Promise<void> {
    this.platform.log.debug('AccessoryBase', 'setCharacteristicValue', 'setValue', characteristic, value);

    if (this.platform.settings.showHomebridgeEvents) {
      this.platform.log.info(`${this.platformAccessory.displayName}: Setting characteristic '${characteristic}' to '${value}'`);
    }
    
    try {
      await setValue(value);
    } catch (error) {
      if (error instanceof Error) {
        this.platform.log.error(error.message);
      }
      throw error;
    }
  }
}