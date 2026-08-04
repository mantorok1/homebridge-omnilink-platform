import type { MatterRequests } from 'homebridge'

import type { UnitStatus } from '../../models/Unit.js'
import type { OmniLinkPlatform } from '../../platform.js'

import { OmniObjectStatusTypes } from '../../models/OmniObjectBase.js'
import { MatterAccessoryBase } from './MatterAccessoryBase.js'

export class UnitWindowCovering extends MatterAccessoryBase {
  constructor(
    platform: OmniLinkPlatform,
    displayName: string,
    key: string,
    index?: number,
  ) {
    platform.log.debug('UnitWindowCovering', 'constructor', displayName, key, index)

    const status: UnitStatus = platform.omniService.omni.units[index!].status
    const currentPositionLiftPercent100ths = UnitWindowCovering.getCurrentPositionLiftPercent100ths(status)

    super(platform, {
      UUID: platform.api.matter!.uuid.generate(key),
      displayName,
      deviceType: platform.api.matter!.deviceTypes.WindowCovering,

      context: {
        type: UnitWindowCovering.type.toLowerCase(),
        index,
        key,
      },

      clusters: {
        windowCovering: {
          currentPositionLiftPercent100ths,
          targetPositionLiftPercent100ths: currentPositionLiftPercent100ths,
          operationalStatus: {
            global: 0,
            lift: 0,
            tilt: 0,
          },
          endProductType: 0,
          configStatus: {
            operational: true,
            onlineReserved: true,
            liftMovementReversed: false,
            liftPositionAware: true,
            tiltPositionAware: false,
            liftEncoderControlled: true,
            tiltEncoderControlled: false,
          },
        },
      },

      handlers: {
        windowCovering: {
          goToLiftPercentage: async request => this.setUnitWindowCoveringLevel(request),
        },
      },
    })

    this.setEventHandlers()
  }

  static type = 'UnitWindowCovering'

  setEventHandlers(): void {
    this.platform.log.debug(this.constructor.name, 'setEventHandlers')

    const index = this.context.index as number
    const eventKey = this.platform.omniService.getEventKey(OmniObjectStatusTypes.Unit, index)

    this.platform.omniService.on(eventKey, this.updateValues.bind(this))
  }

  async setUnitWindowCoveringLevel(request: MatterRequests.GoToLiftPercentage): Promise<void> {
    this.platform.log.debug(this.constructor.name, 'setUnitWindowCoveringLevel', request)

    const index = this.context.index as number
    const position = 100 - Math.round(request.liftPercent100thsValue / 100)
    await this.platform.omniService.setUnitBrightness(index, position)
  }

  async updateValues(status: UnitStatus): Promise<void> {
    this.platform.log.debug(this.constructor.name, 'updateValues', status)

    const currentPositionLiftPercent100ths = UnitWindowCovering.getCurrentPositionLiftPercent100ths(status)

    await this.updateState(this.platform.api.matter!.clusterNames.WindowCovering, {
      currentPositionLiftPercent100ths,
    })
  }

  static getCurrentPositionLiftPercent100ths(status: UnitStatus): number {
    return 10000 - Math.round(status.brightness * 100)
  }
}
