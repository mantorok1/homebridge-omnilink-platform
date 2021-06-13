import crypto = require('crypto');
import { Request } from './messages/Request';

export enum PacketTypes {
  None = 0,
  NewSessionRequest = 1,
  NewSessionAcknowledge = 2,
  SecureConnectionRequest = 3,
  SecureConnectionAcknowledge = 4,
  ClientSessionTerminated = 5,
  ControllerSessionTerminated = 6,
  ControllerSessionFailed = 7,
  ApplicationData = 32
}

export abstract class OmniPacket {
  protected _sequence?: number;
  protected _type?: PacketTypes;
  protected _message?: Buffer;
  protected _crc?: number;

  constructor(private readonly sessionKey?: Buffer) {
  }

  get sequence(): number {
    return this._sequence ?? 0;
  }

  get type(): PacketTypes | undefined {
    return this._type ?? PacketTypes.None;
  }

  get message(): Buffer | undefined {
    return this._message;
  }

  get crc(): number | undefined {
    return this._crc;
  }

  serialise() {
    const header = Buffer.from([this.msb(this.sequence), this.lsb(this.sequence), <number>this.type, 0]);

    if (this.message === undefined) {
      return header;
    }

    let message = this.message;

    // Append CRC
    if (this.type === PacketTypes.ApplicationData) {
      if (this.crc === undefined) {
        this._crc = this.generateCrc(this.message);
      }
      const crc = Buffer.from([this.lsb(this.crc!), this.msb(this.crc!)]);
      message = Buffer.concat([message, crc]);
    }

    // Encrypt
    if (this.sessionKey !== undefined) {
      message = this.encrypt(message);
    }

    return Buffer.concat([header, message]);
  }

  protected generateCrc(message: Buffer): number {
    const updateCrc = (crc: number, data: number): number => {
      const poly = 0xA001;
  
      crc = crc ^ data;
      for (let i = 1; i <= 8; i++) {
        const flag = (crc & 1) !== 0;
        crc = crc >> 1;
        if (flag) {
          crc = crc ^ poly;
        }
      }
  
      return crc;
    };

    let crc = 0;
    for (let i = 1; i < message.length; i++) {
      crc = updateCrc(crc, message[i]);
    }

    return crc;
  }

  protected encrypt(message: Buffer): Buffer {
    const algorithm = 'aes-128-cbc';
    const iv = Buffer.alloc(16);
    const chunks: Buffer[] = [];

    // Pad message buffer to make it a multiple of 16
    if (message.length % 16 > 0) {
      message = Buffer.concat([message, Buffer.alloc(16 - (message.length % 16))]);
    }

    for (let i = 0; i < (message.length / 16); i++) {
      const chunk = message.subarray(i * 16, (i + 1) * 16);
      chunk[0] ^= this.msb(this.sequence);
      chunk[1] ^= this.lsb(this.sequence);
      
      const cipher = crypto
        .createCipheriv(algorithm, this.sessionKey!, iv)
        .setAutoPadding(false);

      chunks.push(cipher.update(chunk));
    }

    return Buffer.concat(chunks);
  }

  decrypt(message: Buffer): Buffer {
    const algorithm = 'aes-128-cbc';
    const iv = Buffer.alloc(16);
    const chunks: Buffer[] = [];

    for (let i = 0; i < (message.length / 16); i++) {
      const decipher = crypto
        .createDecipheriv(algorithm, this.sessionKey!, iv)
        .setAutoPadding(false);

      const encrypted = message.subarray(i * 16, (i + 1) * 16);
      const chunk = decipher.update(encrypted);
      chunk[0] ^= this.msb(this.sequence);
      chunk[1] ^= this.lsb(this.sequence);
      chunks.push(chunk);
    }
    
    return Buffer.concat(chunks);
  }

  private msb(value: number) {
    return (value >> 8) & 0xFF;
  }

  private lsb(value: number) {
    return value & 0xFF;
  }
}

type OmniPacketRequestArgs = {
  sequence: number,
  type: PacketTypes,
  message?: Request,
  sessionKey?: Buffer
}

export class OmniPacketRequest extends OmniPacket {
  constructor(args: OmniPacketRequestArgs) {
    super(args.sessionKey);

    this._sequence = args.sequence;
    this._type = args.type;
    this._message = args.message?.serialize();

    if (args.type === PacketTypes.ApplicationData) {
      this._crc = this.generateCrc(this.message!);
    }
  }
}

type OmniPacketResponseArgs = {
  response: Buffer,
  sessionKey?: Buffer
}

export class OmniPacketResponse extends OmniPacket {
  constructor(args: OmniPacketResponseArgs) {
    super(args.sessionKey);

    let message: Buffer;

    this._sequence = args.response.readUInt16BE(0);
    this._type = <PacketTypes>args.response[2];

    switch(this.type) {
      case PacketTypes.NewSessionAcknowledge:
        this._message = args.response.subarray(4);
        break;
      case PacketTypes.SecureConnectionAcknowledge:
        this._message = this.decrypt(args.response.subarray(4));
        break;
      case PacketTypes.ApplicationData:
        message = this.decrypt(args.response.subarray(4));
        this._message = message.subarray(0, message.length - 2);
        break;
      default:
        this._message = undefined;
        break;
    }
  }
}