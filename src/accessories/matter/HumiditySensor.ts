import type { AuxiliarySensorStatus } from '../../models/AuxiliarySensor.js'
import type { OmniLinkPlatform } from '../../platform.js'

import { OmniObjectStatusTypes } from '../../models/OmniObjectBase.js'
import { MatterAccessoryBase } from './MatterAccessoryBase.js'

export class HumiditySensor extends MatterAccessoryBase {
  constructor(
    platform: OmniLinkPlatform,
    displayName: string,
    key: string,
    index?: number,
  ) {
    platform.log.debug('HumiditySensor', 'constructor', displayName, key, index)

    const status: AuxiliarySensorStatus = platform.omniService.omni.sensors[index!].status
    const measuredValue = HumiditySensor.getCurrentHumidity(status)

    super(platform, {
      UUID: platform.api.matter!.uuid.generate(key),
      displayName,
      deviceType: platform.api.matter!.deviceTypes.HumiditySensor,

      context: {
        type: HumiditySensor.type.toLowerCase(),
        index,
        key,
      },

      clusters: {
        relativeHumidityMeasurement: {
          measuredValue,
          minMeasuredValue: 0,
          maxMeasuredValue: 10000,
        },
      },
    })

    this.setEventHandlers()
  }

  static type = 'HumiditySensor'

  setEventHandlers(): void {
    this.platform.log.debug(this.constructor.name, 'setEventHandlers')

    const index = this.context.index as number
    const eventKey = this.platform.omniService.getEventKey(OmniObjectStatusTypes.AuxiliarySensor, index)

    this.platform.omniService.on(eventKey, this.updateValues.bind(this))
  }

  async updateValues(status: AuxiliarySensorStatus): Promise<void> {
    this.platform.log.debug(this.constructor.name, 'updateValues', status)

    const measuredValue = HumiditySensor.getCurrentHumidity(status)

    await this.updateState(this.platform.api.matter!.clusterNames.RelativeHumidityMeasurement, {
      measuredValue,
    })
  }

  static getCurrentHumidity(status: AuxiliarySensorStatus): number {
    return status.temperature.toPercentage() * 100
  }
}
