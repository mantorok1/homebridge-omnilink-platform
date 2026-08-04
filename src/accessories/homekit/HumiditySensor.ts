import type { CharacteristicValue, PlatformAccessory } from 'homebridge'

import type { AuxiliarySensorStatus } from '../../models/AuxiliarySensor.js'
import type { OmniLinkPlatform } from '../../platform.js'

import { OmniObjectStatusTypes } from '../../models/OmniObjectBase.js'
import { SensorBase } from './SensorBase.js'

export class HumiditySensor extends SensorBase {
  constructor(
    platform: OmniLinkPlatform,
    platformAccessory: PlatformAccessory,
  ) {
    super(platform, platformAccessory)

    this.service = this.platformAccessory.getService(this.platform.Service.HumiditySensor)
      ?? this.platformAccessory.addService(this.platform.Service.HumiditySensor, platformAccessory.displayName)

    this.setEventHandlers()
  }

  static type = 'HumiditySensor'

  setEventHandlers(): void {
    this.platform.log.debug(this.constructor.name, 'setEventHandlers')

    this.service
      .getCharacteristic(this.platform.Characteristic.CurrentRelativeHumidity)
      .onGet(this.getCharacteristicValue.bind(this, this.getCurrentRelativeHumidity.bind(this), 'CurrentRelativeHumidity'))

    this.platform.omniService.on(
      this.platform.omniService.getEventKey(OmniObjectStatusTypes.Zone, this.platformAccessory.context.index),
      super.updateValues.bind(this),
    )
    this.platform.omniService.on(
      this.platform.omniService.getEventKey(OmniObjectStatusTypes.AuxiliarySensor, this.platformAccessory.context.index),
      this.updateSensorValues.bind(this),
    )
  }

  private getCurrentRelativeHumidity(): CharacteristicValue {
    this.platform.log.debug(this.constructor.name, 'getCurrentRelativeHumidity')

    return this.platform.omniService.omni.sensors[this.platformAccessory.context.index].status.temperature.toPercentage()
  }

  updateSensorValues(status: AuxiliarySensorStatus): void {
    this.platform.log.debug(this.constructor.name, 'updateSensorValues', status)

    this.service
      .getCharacteristic(this.platform.Characteristic.CurrentRelativeHumidity)
      .updateValue(status.temperature.toPercentage())
  }
}
