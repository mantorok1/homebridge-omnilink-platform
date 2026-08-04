import type { OmniObjectBaseArgs } from './OmniObjectBase.js'

import { OmniObjectBase, OmniObjectTypes } from './OmniObjectBase.js'

export class Code extends OmniObjectBase {
  constructor(args: OmniObjectBaseArgs) {
    super(OmniObjectTypes.Code, args)
  }
}
