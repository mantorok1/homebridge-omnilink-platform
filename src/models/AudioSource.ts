import { OmniObjectBase, OmniObjectBaseArgs, OmniObjectTypes } from './OmniObjectBase';

export class AudioSource extends OmniObjectBase {
  constructor(args: OmniObjectBaseArgs) {
    super(OmniObjectTypes.AudioSource, args);
  }
}