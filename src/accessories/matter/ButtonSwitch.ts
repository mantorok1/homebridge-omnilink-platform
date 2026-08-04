import type { OmniLinkPlatform } from '../../platform.js'

import { MatterAccessoryBase } from './MatterAccessoryBase.js'

export class ButtonSwitch extends MatterAccessoryBase {
  constructor(
    platform: OmniLinkPlatform,
    displayName: string,
    key: string,
    index?: number,
  ) {
    platform.log.debug('ButtonSwitch', 'constructor', displayName, key, index)

    super(platform, {
      UUID: platform.api.matter!.uuid.generate(key),
      displayName,
      deviceType: platform.api.matter!.deviceTypes.OnOffSwitch,

      context: {
        type: ButtonSwitch.type.toLowerCase(),
        index,
        key,
      },

      clusters: {
        onOff: {
          onOff: false,
        },
      },

      handlers: {
        onOff: {
          on: async () => this.pressButton(),
          off: async () => {},
        },
      },
    })
  }

  static type = 'Button'

  public async pressButton(): Promise<void> {
    this.platform.log.debug(this.constructor.name, 'pressButton')

    const index = this.context.index as number
    await this.platform.omniService.executeButton(index)
    await this.updateState(this.platform.api.matter!.clusterNames.OnOff, {
      onOff: false,
    })
  }
}
