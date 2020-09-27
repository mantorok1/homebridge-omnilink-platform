import crypto = require('crypto');

import { Service, PlatformAccessory, CharacteristicValue, CharacteristicSetCallback, CharacteristicGetCallback } from 'homebridge';
import { OmniLinkPlatform } from '../platform';

export abstract class AccessoryBase {
  protected service!: Service;
  
  constructor(
    protected readonly platform: OmniLinkPlatform,
    public readonly platformAccessory: PlatformAccessory,
  ) { 
    this.setAccessoryInformation();
  }

  abstract serviceName: string;

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

  async getCharacteristicValue(
    getValue: () => Promise<CharacteristicValue>,
    characteristic: string,
    callback: CharacteristicGetCallback,
  ): Promise<void> {
    this.platform.log.debug('AccessoryBase', 'getCharacteristicValue', 'getValue', characteristic, 'callback');

    this.platform.log.info(`${this.platformAccessory.displayName}: Getting characteristic '${characteristic}'`);
    try {
      const value = await getValue();

      callback(null, value);
    } catch (error) {
      this.platform.log.error(error);
      callback(error);
    }
  }

  async setCharacteristicValue(
    setValue,
    characteristic: string,
    value: CharacteristicValue,
    callback: CharacteristicSetCallback,
  ): Promise<void> {
    this.platform.log.debug('AccessoryBase', 'setCharacteristic', 'setValue', characteristic, value, 'callback');

    this.platform.log.info(`${this.platformAccessory.displayName}: Setting characteristic '${characteristic}' to '${value}'`);
    try {
      await setValue(value);

      callback(null);
    } catch (error) {
      this.platform.log.error(error);
      callback(error);
    }
  }
}