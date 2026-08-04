import type { OmniObjectBaseArgs } from './OmniObjectBase.js'

import { OmniObjectBase, OmniObjectTypes } from './OmniObjectBase.js'

export class AudioSource extends OmniObjectBase {
  constructor(args: OmniObjectBaseArgs) {
    super(OmniObjectTypes.AudioSource, args)
  }
}
