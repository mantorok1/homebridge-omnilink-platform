import type { CharacteristicValue, PlatformAccessory } from 'homebridge'

import type { AuxiliarySensorStatus } from '../../models/AuxiliarySensor.js'
import type { OmniLinkPlatform } from '../../platform.js'

import { OmniObjectStatusTypes } from '../../models/OmniObjectBase.js'
import { SensorBase } from './SensorBase.js'

export class TemperatureSensor extends SensorBase {
  constructor(
    platform: OmniLinkPlatform,
    platformAccessory: PlatformAccessory,
  ) {
    super(platform, platformAccessory)

    this.service = this.platformAccessory.getService(this.platform.Service.TemperatureSensor)
      ?? this.platformAccessory.addService(this.platform.Service.TemperatureSensor, platformAccessory.displayName)

    this.setEventHandlers()
  }

  static type = 'TemperatureSensor'

  setEventHandlers(): void {
    this.platform.log.debug(this.constructor.name, 'setEventHandlers')

    this.service
      .getCharacteristic(this.platform.Characteristic.CurrentTemperature)
      .onGet(this.getCharacteristicValue.bind(this, this.getCurrentTemperature.bind(this), 'CurrentTemperature'))

    this.platform.omniService.on(
      this.platform.omniService.getEventKey(OmniObjectStatusTypes.Zone, this.platformAccessory.context.index),
      super.updateValues.bind(this),
    )
    this.platform.omniService.on(
      this.platform.omniService.getEventKey(OmniObjectStatusTypes.AuxiliarySensor, this.platformAccessory.context.index),
      this.updateSensorValues.bind(this),
    )
  }

  private getCurrentTemperature(): CharacteristicValue {
    this.platform.log.debug(this.constructor.name, 'getCurrentTemperature')

    return this.platform.omniService.omni.sensors[this.platformAccessory.context.index].status.temperature.toCelcius()
  }

  updateSensorValues(status: AuxiliarySensorStatus): void {
    this.platform.log.debug(this.constructor.name, 'updateSensorValues', status)

    this.service
      .getCharacteristic(this.platform.Characteristic.CurrentTemperature)
      .updateValue(status.temperature.toCelcius())
  }
}
