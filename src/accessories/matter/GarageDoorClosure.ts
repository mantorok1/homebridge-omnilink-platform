import type { ZoneStatus } from '../../models/Zone.js'
import type { OmniLinkPlatform } from '../../platform.js'

import { OmniObjectStatusTypes } from '../../models/OmniObjectBase.js'
import { MatterAccessoryBase } from './MatterAccessoryBase.js'

export interface MoveToRequest {
  position?: number
  latch?: boolean
  speed?: number
}

export class GarageDoorClosure extends MatterAccessoryBase {
  private zoneId?: number

  constructor(
    platform: OmniLinkPlatform,
    displayName: string,
    key: string,
    index?: number,
  ) {
    platform.log.debug('ButtonSwitch', 'constructor', displayName, key, index)

    const zoneId = platform.settings.garageDoors.get(index!)?.zoneId
    const zoneStatus = platform.omniService.omni.zones[zoneId!].status

    super(platform, {
      UUID: platform.api.matter!.uuid.generate(key),
      displayName,
      deviceType: platform.api.matter!.deviceTypes.Closure,

      context: {
        type: GarageDoorClosure.type.toLowerCase(),
        index,
        key,
      },

      clusters: {
        closureControl: {
          mainState: GarageDoorClosure.getMainState(platform, zoneStatus),
          overallCurrentState: {
            position: GarageDoorClosure.getOverallCurrentStatePosition(platform, zoneStatus),
          },
          overallTargetState: {
            position: GarageDoorClosure.getOverallTargetStatePosition(platform, zoneStatus),
          },
          countdownTime: GarageDoorClosure.getCountdownTime(platform, index!),
          currentErrorList: [],
        },
      },

      handlers: {
        closureControl: {
          moveTo: async request => await this.setMoveTo(request),
          stop: async () => await this.setStop(),
        },
      },
    })

    this.zoneId = zoneId

    this.setEventHandlers()
  }

  static type = 'Closure'

  setEventHandlers(): void {
    this.platform.log.debug(this.constructor.name, 'setEventHandlers')

    const eventKey = this.platform.omniService.getEventKey(OmniObjectStatusTypes.Zone, this.zoneId!)

    this.platform.omniService.on(eventKey, this.updateValues.bind(this))
  }

  private static getMainState(platform: OmniLinkPlatform, status: ZoneStatus): number | undefined {
    return platform.api.matter?.types.ClosureControl.MainState.Stopped
  }

  private static getOverallCurrentStatePosition(platform: OmniLinkPlatform, status: ZoneStatus): number | undefined {
    return status.ready
      ? platform.api.matter!.types.ClosureControl.CurrentPosition.FullyClosed
      : platform.api.matter!.types.ClosureControl.CurrentPosition.FullyOpened
  }

  private static getOverallTargetStatePosition(platform: OmniLinkPlatform, status: ZoneStatus): number | undefined {
    return status.ready
      ? platform.api.matter!.types.ClosureControl.TargetPosition.MoveToFullyClosed
      : platform.api.matter!.types.ClosureControl.TargetPosition.MoveToFullyOpen
  }

  private static getCountdownTime(platform: OmniLinkPlatform, index: number): number {
    return platform.settings.garageDoors.get(index!)?.openTime ?? 10
  }

  private async setMoveTo(request: MoveToRequest): Promise<void> {
    this.platform.log.warn(this.constructor.name, 'setMoveTo', request)

    const status = this.platform.omniService.omni.zones[this.zoneId!].status

    if (request.position === this.platform.api.matter!.types.ClosureControl.TargetPosition.MoveToFullyClosed && !status.ready) {
      await this.platform.omniService.executeButton(this.context.index as number)
      return
    }

    if (request.position === this.platform.api.matter!.types.ClosureControl.TargetPosition.MoveToFullyOpen && status.ready) {
      await this.platform.omniService.executeButton(this.context.index as number)
    }
  }

  private async setStop(): Promise<void> {
    this.platform.log.debug(this.constructor.name, 'setStop')

    this.platform.log.warn('Closure Control \'Stop\' command is not supported ')
  }

  private async updateValues(status: ZoneStatus): Promise<void> {
    this.platform.log.debug(this.constructor.name, 'updateValues', status)
  }
}
