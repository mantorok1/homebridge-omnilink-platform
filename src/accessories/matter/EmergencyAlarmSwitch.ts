import type { AreaStatus } from '../../models/Area.js'
import type { OmniLinkPlatform } from '../../platform.js'

import { Alarms, ArmedModes } from '../../models/Area.js'
import { OmniObjectStatusTypes } from '../../models/OmniObjectBase.js'
import { EmergencyTypes } from '../../omni/messages/enums.js'
import { MatterAccessoryBase } from './MatterAccessoryBase.js'

export class EmergencyAlarmSwitch extends MatterAccessoryBase {
  private areaId: number
  private emergencyType: EmergencyTypes

  constructor(
    platform: OmniLinkPlatform,
    displayName: string,
    key: string,
    index?: number,
  ) {
    platform.log.debug('EmergencyAlarmSwitch', 'constructor', displayName, key, index)

    const areaId = EmergencyAlarmSwitch.getAreaId(index!)
    const emergencyType = EmergencyAlarmSwitch.getEmergencyType(index!)
    const status = platform.omniService.omni.areas[areaId].status
    const onOff = EmergencyAlarmSwitch.getOnOffState(status, emergencyType)

    super(platform, {
      UUID: platform.api.matter!.uuid.generate(key),
      displayName,
      deviceType: platform.api.matter!.deviceTypes.OnOffSwitch,

      context: {
        type: EmergencyAlarmSwitch.type.toLowerCase(),
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
          on: async () => this.setEmergencyAlarmSwitchState(true),
          off: async () => this.setEmergencyAlarmSwitchState(false),
        },
      },
    })

    this.areaId = areaId
    this.emergencyType = emergencyType

    this.setEventHandlers()
  }

  static type = 'EmergencyAlarm'

  setEventHandlers(): void {
    this.platform.log.debug(this.constructor.name, 'setEventHandlers')

    const eventKey = this.platform.omniService.getEventKey(OmniObjectStatusTypes.Area, this.areaId)

    this.platform.omniService.on(eventKey, this.updateValues.bind(this))
  }

  async setEmergencyAlarmSwitchState(state: boolean): Promise<void> {
    this.platform.log.debug(this.constructor.name, 'setEmergencyAlarmSwitchState', state)

    if (state) {
      this.platform.omniService.setEmergencyAlarm(this.areaId, this.emergencyType)
    } else {
      this.platform.omniService.setAreaAlarmMode(this.areaId, ArmedModes.Disarmed)
    }
  }

  async updateValues(status: AreaStatus): Promise<void> {
    this.platform.log.debug(this.constructor.name, 'updateValues', status)

    const state = EmergencyAlarmSwitch.getOnOffState(status, this.emergencyType)

    await this.updateState(this.platform.api.matter!.clusterNames.OnOff, {
      onOff: state,
    })
  }

  static getAreaId(index: number): number {
    return (index & 0xFF00) / 256
  }

  static getEmergencyType(index: number): EmergencyTypes {
    return index & 0xFF
  }

  static getOnOffState(status: AreaStatus, emergencyType: EmergencyTypes): boolean {
    let alarmMode: Alarms | undefined
    switch (emergencyType) {
      case EmergencyTypes.Burglary:
        alarmMode = Alarms.Burglary
        break
      case EmergencyTypes.Fire:
        alarmMode = Alarms.Fire
        break
      case EmergencyTypes.Auxiliary:
        alarmMode = Alarms.Auxiliary
        break
    }

    return status.alarmsTriggered.includes(alarmMode!)
  }
}
