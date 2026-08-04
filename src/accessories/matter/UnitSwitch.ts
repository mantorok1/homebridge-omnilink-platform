import type { UnitStatus } from '../../models/Unit.js'
import type { OmniLinkPlatform } from '../../platform.js'

import { OmniObjectStatusTypes } from '../../models/OmniObjectBase.js'
import { UnitStates } from '../../models/Unit.js'
import { MatterAccessoryBase } from './MatterAccessoryBase.js'

export class UnitSwitch extends MatterAccessoryBase {
  constructor(
    platform: OmniLinkPlatform,
    displayName: string,
    key: string,
    index?: number,
  ) {
    platform.log.debug('UnitSwitch', 'constructor', displayName, key, index)

    const status: UnitStatus = platform.omniService.omni.units[index!].status
    const onOff = UnitSwitch.getOnOffState(status)

    super(platform, {
      UUID: platform.api.matter!.uuid.generate(key),
      displayName,
      deviceType: platform.api.matter!.deviceTypes.OnOffSwitch,

      context: {
        type: UnitSwitch.type.toLowerCase(),
        index,
        key,
      },

      clusters: {
        onOff: {
          onOff,
        },
      },

      handlers: {
        onOff: {
          on: async () => this.setUnitSwitchState(true),
          off: async () => this.setUnitSwitchState(false),
        },
      },
    })

    this.setEventHandlers()
  }

  static type = 'UnitSwitch'

  setEventHandlers(): void {
    this.platform.log.debug(this.constructor.name, 'setEventHandlers')

    const index = this.context.index as number
    const eventKey = this.platform.omniService.getEventKey(OmniObjectStatusTypes.Unit, index)

    this.platform.omniService.on(eventKey, this.updateValues.bind(this))
  }

  async setUnitSwitchState(state: boolean): Promise<void> {
    this.platform.log.debug(this.constructor.name, 'setUnitSwitchState', state)

    const index = this.context.index as number
    await this.platform.omniService.setUnitState(index, state)
  }

  async updateValues(status: UnitStatus): Promise<void> {
    this.platform.log.debug(this.constructor.name, 'updateValues', status)

    const state = UnitSwitch.getOnOffState(status)

    await this.updateState(this.platform.api.matter!.clusterNames.OnOff, {
      onOff: state,
    })
  }

  static getOnOffState(status: UnitStatus): boolean {
    return status.state === UnitStates.On
  }
}
