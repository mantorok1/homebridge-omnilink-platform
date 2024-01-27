import { ApplicationDataResponse } from './ApplicationDataResponse';

export class ExtendedAudioZoneStatusResponse extends ApplicationDataResponse {

  private readonly _id: number[] = [];
  private readonly _state: number[] = [];
  private readonly _sourceId: number[] = [];
  private readonly _volume: number[] = [];
  private readonly _mute: number[] = [];

  constructor(message: Buffer) {
    super(message);

    const recordLength = message[4];
    const zoneCount = (message[1] - 3) / recordLength;
    let offset = 5;
    for(let i = 1; i <= zoneCount; i++) {
      this._id.push(message.readUInt16BE(offset));
      this._state.push(message[offset + 2]);
      this._sourceId.push(message[offset + 3]);
      this._volume.push(message[offset + 4]);
      this._mute.push(message[offset + 5]);
      offset += recordLength;
    }
  }

  get id(): number[] {
    return this._id;
  }

  get state(): number[] {
    return this._state;
  }

  get sourceId(): number[] {
    return this._sourceId;
  }

  get volume(): number[] {
    return this._volume;
  }

  get mute(): number[] {
    return this._mute;
  }
}