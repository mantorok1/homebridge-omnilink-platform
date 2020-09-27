import { ApplicationDataResponse } from './ApplicationDataResponse';

export class SystemInformationResponse extends ApplicationDataResponse {

  private _modelNumber?: number;
  private _majorVersion?: number;
  private _minorVersion?: number;
  private _revision?: number;

  get model(): string {
    switch(this._modelNumber!) {
      case 2:
        return 'Omni';
      case 4:
        return 'OmniPro';
      case 5:
        return 'Aegis';
      case 9:
        return 'Omni LT';
      case 15:
        return 'Omni II';
      case 16:
        return 'OmniPro II';
      case 30:
        return 'Omni IIe';
      case 33:
        return 'Omni IIe B';
      case 36:
        return 'Lumina';
      case 37:
        return 'Lumina Pro';
      case 38:
        return 'Omni LTe';
      default:
        return `Model ${this._modelNumber}`;
    }
  }

  get version(): string {
    let ver = `${this._majorVersion}.${this._minorVersion}`;
    if (this._revision! > 0 && this._revision! <= 26) {
      ver += String.fromCharCode(96 + this._revision!);
    } else if (this._revision !== 0) {
      ver += ' X' + (256 - this._revision!);
    }
    return ver;
  }

  deserialize(message: Buffer): void {
    super.deserialize(message);

    this._modelNumber = message[3];
    this._majorVersion = message[4];
    this._minorVersion = message[5];
    this._revision = message[6];
  }
}