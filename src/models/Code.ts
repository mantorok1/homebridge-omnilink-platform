import { OmniObjectBase, OmniObjectBaseArgs, OmniObjectTypes } from './OmniObjectBase';

export class Code extends OmniObjectBase {
  constructor(args: OmniObjectBaseArgs) {
    super(OmniObjectTypes.Code, args);
  }
}