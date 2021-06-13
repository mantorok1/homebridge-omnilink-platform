import { OmniObjectBase, OmniObjectBaseArgs, OmniObjectTypes } from './OmniObjectBase';

export class Button extends OmniObjectBase {
  constructor(args: OmniObjectBaseArgs) {
    super(OmniObjectTypes.Button, args);
  }
}