import { CharacteristicValue, PlatformAccessory, Service } from 'homebridge';
import { AudioZoneStatus } from '../models/AudioZone';
import { OmniObjectStatusTypes } from '../models/OmniObjectBase';
import { AudioZoneCommandStates } from '../omni/messages/enums';
import { OmniLinkPlatform } from '../platform';
import { AccessoryBase } from './AccessoryBase';

export class AudioZoneTelevision extends AccessoryBase {
  private speakerService: Service;

  constructor(
    platform: OmniLinkPlatform,
    platformAccessory: PlatformAccessory,   
  ) {
    super(platform, platformAccessory);

    platformAccessory.category = this.platform.api.hap.Categories.SPEAKER;

    this.service = this.platformAccessory.addService(this.platform.Service.Television, platformAccessory.displayName);
    this.speakerService = this.platformAccessory.addService(this.platform.Service.TelevisionSpeaker, platformAccessory.displayName);

    this.setEventHandlers();

    // Input sources
    for(const [index, audioSource] of this.platform.omniService.omni.audioSources.entries()) {
      const inputSource = this.platformAccessory.addService(this.platform.Service.InputSource, audioSource.name, index.toString());
      inputSource
        .setCharacteristic(this.platform.Characteristic.Identifier, index)
        .setCharacteristic(this.platform.Characteristic.ConfiguredName, audioSource.name)
        .setCharacteristic(this.platform.Characteristic.IsConfigured, this.platform.Characteristic.IsConfigured.CONFIGURED)
        .setCharacteristic(this.platform.Characteristic.InputSourceType, this.platform.Characteristic.InputSourceType.OTHER);
      this.service.addLinkedService(inputSource);
    }
  }

  static type = 'AudioZoneTelevision';

  setEventHandlers(): void {
    this.platform.log.debug(this.constructor.name, 'setEventHandlers');

    // Television
    this.service
      .setCharacteristic(
        this.platform.Characteristic.ConfiguredName, this.platformAccessory.displayName)
      .setCharacteristic(
        this.platform.Characteristic.SleepDiscoveryMode, this.platform.Characteristic.SleepDiscoveryMode.ALWAYS_DISCOVERABLE);

    this.service
      .getCharacteristic(this.platform.Characteristic.Active)
      .onGet(this.getCharacteristicValue.bind(this, this.getTelevisionActive.bind(this), 'Active'))
      .onSet(this.setCharacteristicValue.bind(this, this.setTelevisionActive.bind(this), 'Active'));
      
    this.service
      .getCharacteristic(this.platform.Characteristic.ActiveIdentifier)
      .onGet(this.getCharacteristicValue.bind(this, this.getActiveIdentifier.bind(this), 'ActiveIdentifier'))
      .onSet(this.setCharacteristicValue.bind(this, this.setActiveIdentifier.bind(this), 'ActiveIdentifier'));

    this.service
      .getCharacteristic(this.platform.Characteristic.RemoteKey)
      .onSet(this.setCharacteristicValue.bind(this, this.setRemoteKey.bind(this), 'RemoteKey'));

    // Television Speaker
    this.speakerService
      .setCharacteristic(
        this.platform.Characteristic.Active, this.platform.Characteristic.Active.ACTIVE)
      .setCharacteristic(
        this.platform.Characteristic.VolumeControlType, this.platform.Characteristic.VolumeControlType.ABSOLUTE);

    this.speakerService
      .getCharacteristic(this.platform.Characteristic.VolumeSelector)
      .onSet(this.setCharacteristicValue.bind(this, this.setVolumeSelector.bind(this), 'VolumeSelector'));

    this.platform.omniService.on(
      this.platform.omniService.getEventKey(OmniObjectStatusTypes.AudioZone, this.platformAccessory.context.index),
      this.updateValues.bind(this));
  }

  private getTelevisionActive(): CharacteristicValue {
    this.platform.log.debug(this.constructor.name, 'getTelevisionActive');

    const status = this.platform.omniService.omni.audioZones[this.platformAccessory.context.index].status;

    return status.power
      ? this.platform.Characteristic.Active.ACTIVE
      : this.platform.Characteristic.Active.INACTIVE;
  }

  private async setTelevisionActive(value: CharacteristicValue): Promise<void> {
    this.platform.log.debug(this.constructor.name, 'setTelevisionActive', value);

    const state = value === this.platform.Characteristic.Active.ACTIVE
      ? AudioZoneCommandStates.On
      : AudioZoneCommandStates.Off;

    await this.platform.omniService.setAudioZoneState(this.platformAccessory.context.index, state);
  }

  private getActiveIdentifier(): CharacteristicValue {
    this.platform.log.debug(this.constructor.name, 'getActiveIdentifier');

    const status = this.platform.omniService.omni.audioZones[this.platformAccessory.context.index].status;

    return status.sourceId;
  }

  private async setActiveIdentifier(value: CharacteristicValue): Promise<void> {
    this.platform.log.debug(this.constructor.name, 'setActiveIdentifier', value);

    await this.platform.omniService.setAudioZoneSource(this.platformAccessory.context.index, value as number);
  }

  private async setRemoteKey(value: CharacteristicValue): Promise<void> {
    this.platform.log.debug(this.constructor.name, 'setRemoteKey', value);

    switch(value) {
      case this.platform.Characteristic.RemoteKey.ARROW_UP: {
        await this.setVolumeSelector(this.platform.Characteristic.VolumeSelector.INCREMENT);
        break;
      }
      case this.platform.Characteristic.RemoteKey.ARROW_DOWN: {
        await this.setVolumeSelector(this.platform.Characteristic.VolumeSelector.DECREMENT);
        break;
      }
      case this.platform.Characteristic.RemoteKey.ARROW_LEFT: {
        let value = this.platform.omniService.omni.audioZones[this.platformAccessory.context.index].status.sourceId;
        value = value <= 1
          ? this.platform.omniService.omni.audioSources.length
          : value - 1;
        await this.setActiveIdentifier(value);
        break;
      }
      case this.platform.Characteristic.RemoteKey.ARROW_RIGHT: {
        let value = this.platform.omniService.omni.audioZones[this.platformAccessory.context.index].status.sourceId;
        value = value >= this.platform.omniService.omni.audioSources.length
          ? 1
          : value + 1;
        await this.setActiveIdentifier(value);
        break;
      }
      case this.platform.Characteristic.RemoteKey.SELECT: {
        const value = !this.platform.omniService.omni.audioZones[this.platformAccessory.context.index].status.mute;
        await this.setMute(value);
        break;
      }
      case this.platform.Characteristic.RemoteKey.PLAY_PAUSE: {
        const value = this.platform.omniService.omni.audioZones[this.platformAccessory.context.index].status.power
          ? this.platform.Characteristic.Active.INACTIVE
          : this.platform.Characteristic.Active.ACTIVE;
        await this.setTelevisionActive(value);
        break;
      }
    }
  }

  private async setVolumeSelector(value: CharacteristicValue): Promise<void> {
    this.platform.log.debug(this.constructor.name, 'setVolumeSelector', value);

    let volume = this.platform.omniService.omni.audioZones[this.platformAccessory.context.index].status.volume;

    if (value === this.platform.Characteristic.VolumeSelector.INCREMENT) {
      volume += 10;
    } else {
      volume -= 10;
    }

    await this.platform.omniService.setAudioZoneVolume(this.platformAccessory.context.index, volume);
  }

  private async setMute(value: boolean): Promise<void> {
    this.platform.log.debug(this.constructor.name, 'setMute', value);

    const state = value
      ? AudioZoneCommandStates.MuteOn
      : AudioZoneCommandStates.MuteOff;

    await this.platform.omniService.setAudioZoneState(this.platformAccessory.context.index, state);
  }

  updateValues(status: AudioZoneStatus): void {
    this.platform.log.debug(this.constructor.name, 'updateValues');

    const active = status.power
      ? this.platform.Characteristic.Active.ACTIVE
      : this.platform.Characteristic.Active.INACTIVE;

    this.service
      .getCharacteristic(this.platform.Characteristic.Active)
      .updateValue(active);

    this.service
      .getCharacteristic(this.platform.Characteristic.ActiveIdentifier)
      .updateValue(status.sourceId);
  }
}