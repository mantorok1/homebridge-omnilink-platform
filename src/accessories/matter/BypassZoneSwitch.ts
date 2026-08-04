import type { ZoneStatus } from '../../models/Zone.js'
import type { OmniLinkPlatform } from '../../platform.js'

import { OmniObjectStatusTypes } from '../../models/OmniObjectBase.js'
import { MatterAccessoryBase } from './MatterAccessoryBase.js'

export class BypassZoneSwitch extends MatterAccessoryBase {
  constructor(
    platform: OmniLinkPlatform,
    displayName: string,
    key: string,
    index?: number,
  ) {
    platform.log.debug('BypassZoneSwitch', 'constructor', displayName, key, index)

    const status: ZoneStatus = platform.omniService.omni.zones[index!].status
    const onOff = BypassZoneSwitch.getOnOffState(status)

    super(platform, {
      UUID: platform.api.matter!.uuid.generate(key),
      displayName,
      deviceType: platform.api.matter!.deviceTypes.OnOffSwitch,

      context: {
        type: BypassZoneSwitch.type.toLowerCase(),
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
          on: async () => this.setBypassZoneSwitchState(true),
          off: async () => this.setBypassZoneSwitchState(false),
        },
      },
    })

    this.setEventHandlers()
  }

  static type = 'BypassZoneSwitch'

  setEventHandlers(): void {
    this.platform.log.debug(this.constructor.name, 'setEventHandlers')

    const index = this.context.index as number
    const eventKey = this.platform.omniService.getEventKey(OmniObjectStatusTypes.Zone, index)

    this.platform.omniService.on(eventKey, this.updateValues.bind(this))
  }

  async setBypassZoneSwitchState(state: boolean): Promise<void> {
    this.platform.log.debug(this.constructor.name, 'setBypassZoneSwitchState', state)

    const index = this.context.index as number
    await this.platform.omniService.setZoneBypass(index, state)
  }

  async updateValues(status: ZoneStatus): Promise<void> {
    this.platform.log.debug(this.constructor.name, 'updateValues', status)

    const state = BypassZoneSwitch.getOnOffState(status)

    await this.updateState(this.platform.api.matter!.clusterNames.OnOff, {
      onOff: state,
    })
  }

  static getOnOffState(status: ZoneStatus): boolean {
    return status.bypassed
  }
}
