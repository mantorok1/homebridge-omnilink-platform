export abstract class Response {
  constructor(private message: Buffer) {
  }

  toString(): string {
    return `${[...this.message.values()]} [${this.constructor.name}]`;
  }
}