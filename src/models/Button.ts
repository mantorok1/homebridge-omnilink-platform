import type { OmniObjectBaseArgs } from './OmniObjectBase.js'

import { OmniObjectBase, OmniObjectTypes } from './OmniObjectBase.js'

export class Button extends OmniObjectBase {
  constructor(args: OmniObjectBaseArgs) {
    super(OmniObjectTypes.Button, args)
  }
}
