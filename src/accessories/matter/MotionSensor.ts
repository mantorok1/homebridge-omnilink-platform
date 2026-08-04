import type { ZoneStatus } from '../../models/Zone.js'
import type { OmniLinkPlatform } from '../../platform.js'

import { OmniObjectStatusTypes } from '../../models/OmniObjectBase.js'
import { MatterAccessoryBase } from './MatterAccessoryBase.js'

export class MotionSensor extends MatterAccessoryBase {
  constructor(
    platform: OmniLinkPlatform,
    displayName: string,
    key: string,
    index?: number,
  ) {
    platform.log.debug('MotionSensor', 'constructor', displayName, key, index)

    const status: ZoneStatus = platform.omniService.omni.zones[index!].status
    const occupied = MotionSensor.getCurrentOccupancy(status)

    super(platform, {
      UUID: platform.api.matter!.uuid.generate(key),
      displayName,
      deviceType: platform.api.matter!.deviceTypes.MotionSensor,

      context: {
        type: MotionSensor.type.toLowerCase(),
        index,
        key,
      },

      clusters: {
        occupancySensing: {
          occupancy: {
            occupied,
          },
        },
      },
    })

    this.setEventHandlers()
  }

  static type = 'MotionSensor'

  setEventHandlers(): void {
    this.platform.log.debug(this.constructor.name, 'setEventHandlers')

    const index = this.context.index as number
    const eventKey = this.platform.omniService.getEventKey(OmniObjectStatusTypes.Zone, index)

    this.platform.omniService.on(eventKey, this.updateValues.bind(this))
  }

  async updateValues(status: ZoneStatus): Promise<void> {
    this.platform.log.debug(this.constructor.name, 'updateValues', status)

    const occupied = MotionSensor.getCurrentOccupancy(status)

    await this.updateState(this.platform.api.matter!.clusterNames.OccupancySensing, {
      occupancy: { occupied },
    })
  }

  static getCurrentOccupancy(status: ZoneStatus): boolean {
    return !status.ready
  }
}
