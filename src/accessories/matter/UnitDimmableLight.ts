import type { MatterRequests } from 'homebridge'

import type { UnitStatus } from '../../models/Unit.js'
import type { OmniLinkPlatform } from '../../platform.js'

import { OmniObjectStatusTypes } from '../../models/OmniObjectBase.js'
import { UnitStates } from '../../models/Unit.js'
import { MatterAccessoryBase } from './MatterAccessoryBase.js'

export class UnitDimmableLight extends MatterAccessoryBase {
  constructor(
    platform: OmniLinkPlatform,
    displayName: string,
    key: string,
    index?: number,
  ) {
    platform.log.debug('UnitDimmableLight', 'constructor', displayName, key, index)

    const status: UnitStatus = platform.omniService.omni.units[index!].status
    const onOff = UnitDimmableLight.getOnOffState(status)
    const currentLevel = UnitDimmableLight.getCurrentLevel(status)

    super(platform, {
      UUID: platform.api.matter!.uuid.generate(key),
      displayName,
      deviceType: platform.api.matter!.deviceTypes.DimmableLight,

      context: {
        type: UnitDimmableLight.type.toLowerCase(),
        index,
        key,
      },

      clusters: {
        onOff: {
          onOff,
        },
        levelControl: {
          currentLevel,
          minLevel: 1,
          maxLevel: 254,
        },
      },

      handlers: {
        onOff: {
          on: async () => this.setUnitDimmableLightState(true),
          off: async () => this.setUnitDimmableLightState(false),
        },
        levelControl: {
          moveToLevel: async request => this.setUnitDimmableLightLevel(request),
        },
      },
    })

    this.setEventHandlers()
  }

  static type = 'UnitDimmableLight'

  setEventHandlers(): void {
    this.platform.log.debug(this.constructor.name, 'setEventHandlers')

    const index = this.context.index as number
    const eventKey = this.platform.omniService.getEventKey(OmniObjectStatusTypes.Unit, index)

    this.platform.omniService.on(eventKey, this.updateValues.bind(this))
  }

  async setUnitDimmableLightState(state: boolean): Promise<void> {
    this.platform.log.debug(this.constructor.name, 'setUnitDimmableLightState', state)

    const index = this.context.index as number
    await this.platform.omniService.setUnitState(index, state)
  }

  async setUnitDimmableLightLevel(request: MatterRequests.MoveToLevel): Promise<void> {
    this.platform.log.debug(this.constructor.name, 'setUnitDimmableLightLevel', request)

    const index = this.context.index as number
    const { level, transitionTime } = request
    const brightness = Math.round(level / 254 * 100)
    await this.platform.omniService.setUnitBrightness(index, brightness)
  }

  async updateValues(status: UnitStatus): Promise<void> {
    this.platform.log.debug(this.constructor.name, 'updateValues', status)

    const state = UnitDimmableLight.getOnOffState(status)
    const currentLevel = UnitDimmableLight.getCurrentLevel(status)

    await this.updateState(this.platform.api.matter!.clusterNames.OnOff, {
      onOff: state,
    })
    await this.updateState(this.platform.api.matter!.clusterNames.LevelControl, {
      currentLevel,
    })
  }

  static getOnOffState(status: UnitStatus): boolean {
    return status.state === UnitStates.On
  }

  static getCurrentLevel(status: UnitStatus): number {
    return Math.max(1, Math.round(status.brightness / 100 * 254))
  }
}
