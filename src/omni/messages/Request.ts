export abstract class Request {

  serialize(): Buffer {
    return Buffer.alloc(0);
  }

  protected msb(value: number) {
    return (value >> 8) & 0xFF;
  }

  protected lsb(value: number) {
    return value & 0xFF;
  }
}