import type { ZoneStatus } from '../../models/Zone.js'
import type { OmniLinkPlatform } from '../../platform.js'

import { OmniObjectStatusTypes } from '../../models/OmniObjectBase.js'
import { MatterAccessoryBase } from './MatterAccessoryBase.js'

export class ContactSensor extends MatterAccessoryBase {
  constructor(
    platform: OmniLinkPlatform,
    displayName: string,
    key: string,
    index?: number,
  ) {
    platform.log.debug('ContactSensor', 'constructor', displayName, key, index)

    const status: ZoneStatus = platform.omniService.omni.zones[index!].status
    const stateValue: boolean = ContactSensor.getCurrentState(status)

    super(platform, {
      UUID: platform.api.matter!.uuid.generate(key),
      displayName,
      deviceType: platform.api.matter!.deviceTypes.ContactSensor,

      context: {
        type: ContactSensor.type.toLowerCase(),
        index,
        key,
      },

      clusters: {
        booleanState: {
          stateValue,
        },
      },
    })

    this.setEventHandlers()
  }

  static type = 'ContactSensor'

  setEventHandlers(): void {
    this.platform.log.debug(this.constructor.name, 'setEventHandlers')

    const index = this.context.index as number
    const eventKey = this.platform.omniService.getEventKey(OmniObjectStatusTypes.Zone, index)

    this.platform.omniService.on(eventKey, this.updateValues.bind(this))
  }

  async updateValues(status: ZoneStatus): Promise<void> {
    this.platform.log.debug(this.constructor.name, 'updateValues', status)

    const stateValue: boolean = ContactSensor.getCurrentState(status)
    await this.updateState(this.platform.api.matter!.clusterNames.BooleanState, {
      stateValue,
    })
  }

  static getCurrentState(status: ZoneStatus): boolean {
    return status.ready // true = closed, false = open
  }
}
