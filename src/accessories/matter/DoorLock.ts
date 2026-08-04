import type { AccessControlLockStatus } from '../../models/AccessControl.js'
import type { OmniLinkPlatform } from '../../platform.js'

import { OmniObjectStatusTypes } from '../../models/OmniObjectBase.js'
import { MatterAccessoryBase } from './MatterAccessoryBase.js'

export class DoorLock extends MatterAccessoryBase {
  constructor(
    platform: OmniLinkPlatform,
    displayName: string,
    key: string,
    index?: number,
  ) {
    platform.log.debug('DoorLock', 'constructor', displayName, key, index)

    const status = platform.omniService.omni.accessControls[index!].lockStatus
    const lockState = DoorLock.getCurrentLockState(status)

    super(platform, {
      UUID: platform.api.matter!.uuid.generate(key),
      displayName,
      deviceType: platform.api.matter!.deviceTypes.DoorLock,

      context: {
        type: DoorLock.type.toLowerCase(),
        index,
        key,
      },

      clusters: {
        doorLock: {
          lockState,
          lockType: platform.api.matter!.types.DoorLock.LockType.DeadBolt,
          actuatorEnabled: true,
          operatingMode: platform.api.matter!.types.DoorLock.OperatingMode.Normal,
        },
      },

      handlers: {
        doorLock: {
          lockDoor: async () => this.setLockState(true),
          unlockDoor: async () => this.setLockState(false),
        },
      },
    })

    this.setEventHandlers()
  }

  static type = 'DoorLock'

  setEventHandlers(): void {
    this.platform.log.debug(this.constructor.name, 'setEventHandlers')

    const eventKey = this.platform.omniService.getEventKey(OmniObjectStatusTypes.AccessControlLock, this.context.index as number)

    this.platform.omniService.on(eventKey, this.updateValues.bind(this))
  }

  async updateValues(status: AccessControlLockStatus): Promise<void> {
    this.platform.log.debug(this.constructor.name, 'updateValues', status)

    const lockState = DoorLock.getCurrentLockState(status)

    await this.updateState(this.platform.api.matter!.clusterNames.DoorLock, {
      lockState,
    })
  }

  async setLockState(state: boolean): Promise<void> {
    this.platform.log.debug(this.constructor.name, 'setLockState', state)

    const index = this.context.index as number
    await this.platform.omniService.setLockState(index, state)
  }

  static getCurrentLockState(status: AccessControlLockStatus): number {
    return status.locked
      ? 1 // Locked
      : 2 // Unlocked
  }
}
