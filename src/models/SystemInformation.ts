interface SystemInformationArgs {
  modelNumber: number,
  majorVersion: number,
  minorVersion: number,
  revision: number,
  localPhoneNumber: string
}

export class SystemInformation {

  constructor(private args: SystemInformationArgs) {
  }

  get model(): string {
    switch(this.args.modelNumber) {
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
        return `Model ${this.args.modelNumber}`;
    }
  }

  get version(): string {
    let ver = `${this.args.majorVersion}.${this.args.minorVersion}`;
    if (this.args.revision > 0 && this.args.revision <= 26) {
      ver += String.fromCharCode(96 + this.args.revision);
    } else if (this.args.revision !== 0) {
      ver += ' X' + (256 - this.args.revision);
    }
    return ver;
  }

  get localPhoneNumber(): string {
    return this.args.localPhoneNumber;
  }
}