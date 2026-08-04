import type { CharacteristicValue, PlatformAccessory } from 'homebridge'

import type { ZoneStatus } from '../../models/Zone.js'
import type { OmniLinkPlatform } from '../../platform.js'

import { OmniObjectStatusTypes } from '../../models/OmniObjectBase.js'
import { SensorBase } from './SensorBase.js'

export class LeakSensor extends SensorBase {
  constructor(
    platform: OmniLinkPlatform,
    platformAccessory: PlatformAccessory,
  ) {
    super(platform, platformAccessory)

    this.service = this.platformAccessory.getService(this.platform.Service.LeakSensor)
      ?? this.platformAccessory.addService(this.platform.Service.LeakSensor, platformAccessory.displayName)

    this.setEventHandlers()
  }

  static type = 'LeakSensor'

  setEventHandlers(): void {
    this.platform.log.debug(this.constructor.name, 'setEventHandlers')

    super.setEventHandlers()

    this.service
      .getCharacteristic(this.platform.Characteristic.LeakDetected)
      .onGet(this.getCharacteristicValue.bind(this, this.getLeakDetected.bind(this), 'LeakDetected'))

    this.platform.omniService.on(this.platform.omniService.getEventKey(OmniObjectStatusTypes.Zone, this.platformAccessory.context.index), this.updateValues.bind(this))
  }

  private getLeakDetected(): CharacteristicValue {
    this.platform.log.debug(this.constructor.name, 'getLeakDetected')

    const zoneStatus = this.platform.omniService.omni.zones[this.platformAccessory.context.index].status

    return zoneStatus!.ready
      ? this.platform.Characteristic.LeakDetected.LEAK_NOT_DETECTED
      : this.platform.Characteristic.LeakDetected.LEAK_DETECTED
  }

  updateValues(zoneStatus: ZoneStatus): void {
    this.platform.log.debug(this.constructor.name, 'updateValues', zoneStatus)

    super.updateValues(zoneStatus)

    const leakDetected = zoneStatus!.ready
      ? this.platform.Characteristic.LeakDetected.LEAK_NOT_DETECTED
      : this.platform.Characteristic.LeakDetected.LEAK_DETECTED

    this.service
      .getCharacteristic(this.platform.Characteristic.LeakDetected)
      .updateValue(leakDetected)
  }
}
