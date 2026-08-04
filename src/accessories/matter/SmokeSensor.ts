import type { ZoneStatus } from '../../models/Zone.js'
import type { OmniLinkPlatform } from '../../platform.js'

import { OmniObjectStatusTypes } from '../../models/OmniObjectBase.js'
import { MatterAccessoryBase } from './MatterAccessoryBase.js'

export class SmokeSensor extends MatterAccessoryBase {
  constructor(
    platform: OmniLinkPlatform,
    displayName: string,
    key: string,
    index?: number,
  ) {
    platform.log.debug('SmokeSensor', 'constructor', displayName, key, index)

    const status: ZoneStatus = platform.omniService.omni.zones[index!].status
    const smokeState: number = SmokeSensor.getCurrentSmokeState(status)
    const hardwareFaultAlert: boolean = SmokeSensor.getCurrentHardwareFaultAlert(status)

    super(platform, {
      UUID: platform.api.matter!.uuid.generate(key),
      displayName,
      deviceType: platform.api.matter!.deviceTypes.SmokeSensor,

      context: {
        type: SmokeSensor.type.toLowerCase(),
        index,
        key,
      },

      clusters: {
        smokeCoAlarm: {
          smokeState,
          coState: 0,
          batteryAlert: 0,
          deviceMuted: 0,
          testInProgress: false,
          hardwareFaultAlert,
          endOfServiceAlert: 0,
          interconnectSmokeAlarm: 0,
          interconnectCoAlarm: 0,
          contaminationState: 0,
          smokeSensitivityLevel: 1,
          expressedState: 0,
        },
      },
    })

    this.setEventHandlers()
  }

  static type = 'SmokeSensor'

  setEventHandlers(): void {
    this.platform.log.debug(this.constructor.name, 'setEventHandlers')

    const index = this.context.index as number
    const eventKey = this.platform.omniService.getEventKey(OmniObjectStatusTypes.Zone, index)

    this.platform.omniService.on(eventKey, this.updateValues.bind(this))
  }

  async updateValues(status: ZoneStatus): Promise<void> {
    this.platform.log.debug(this.constructor.name, 'updateValues', status)

    const smokeState: number = SmokeSensor.getCurrentSmokeState(status)
    const hardwareFaultAlert: boolean = SmokeSensor.getCurrentHardwareFaultAlert(status)

    await this.updateState(this.platform.api.matter!.clusterNames.SmokeCoAlarm, {
      smokeState,
      hardwareFaultAlert,
    })
  }

  static getCurrentSmokeState(status: ZoneStatus): number {
    return status.ready
      ? 0 // normal
      : 2 // critical
  }

  static getCurrentHardwareFaultAlert(status: ZoneStatus): boolean {
    return status.trouble
  }
}
