export abstract class Response {
  constructor(message: Buffer) {
    this.deserialize(message);
  }

  abstract deserialize(message: Buffer): void;
}