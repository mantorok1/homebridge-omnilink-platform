import { MessageTypes } from './enums';
import { ApplicationDataRequest } from './ApplicationDataRequest';

type ControllerCommandRequestArgs = {
  command: number,
  parameter1: number,
  parameter2: number
}

export class ControllerCommandRequest extends ApplicationDataRequest {

  private readonly type = MessageTypes.ControllerCommandRequest;

  constructor(args: ControllerCommandRequestArgs) {
    super();
    this.command = args.command;
    this.parameter1 = args.parameter1;
    this.parameter2 = args.parameter2;
  }

  command = 0;    // 0 - 255
  parameter1 = 0; // 0 - 255
  parameter2 = 0; // 0 - 65535

  get data(): Buffer {
    return Buffer.from([this.type, this.command, this.parameter1, this.msb(this.parameter2), this.lsb(this.parameter2)]);
  }
}