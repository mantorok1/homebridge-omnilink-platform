import Pushover = require('pushover-notifications');

import { OmniLinkPlatform } from '../platform';
import { AreaStatus } from '../omni/OmniService';

export class PushoverService {
  private pushover;
  private readonly token?: string;
  private readonly users: string[] = [];

  constructor(private readonly platform: OmniLinkPlatform) {
    if (this.platform.settings.pushover === undefined) {
      return;
    }

    if (this.platform.settings.pushover.token === undefined) {
      return;
    }

    if (this.platform.settings.pushover.users === undefined) {
      return;
    }

    if (!Array.isArray(this.platform.settings.pushover.users)) {
      return;
    }

    this.token = this.platform.settings.pushover.token;
    this.users = this.platform.settings.pushover.users;
  }

  init() {
    this.platform.log.debug(this.constructor.name, 'init');

    if (this.token === undefined || this.users.length === 0) {
      return;
    }

    this.pushover = new Pushover({
      token: this.token,
    });

    for(const [areaId, area] of this.platform.omniService.areas.entries()) {
      this.platform.omniService.on(`area-${areaId}`, this.sendMessage.bind(this, area.name));
    }
  }

  sendMessage(areaName: string, status: AreaStatus): void {
    this.platform.log.debug(this.constructor.name, 'sendMessage', areaName, status);

    try {
      const pushoverMessage = {
        title: this.platform.settings.name,
        message: '',
        sound: 'siren',
        priority: 2,  // Emergency Priorty
        expire: 600,  // 10 minutes
        retry: 60,    // 1 minute
        user: '',
      };

      for (const message of this.getMessages(areaName, status)) {
        for (const user of this.users) {
          pushoverMessage.message = message;
          pushoverMessage.user = user;
  
          this.pushover.send(pushoverMessage, (error) => {
            if (error) {
              throw error;
            }
          });
        }
      }
    } catch(error) {
      this.platform.log.warn('Pushover notification(s) failed:', error.message);
    }
  }

  private getMessages(areaName: string, status: AreaStatus): string[] {
    this.platform.log.debug(this.constructor.name, 'getMessages', areaName, status);

    const messages: string[] = [];

    if (status.burglaryTriggered && (this.platform.settings.pushover!.burglary ?? false)) {
      messages.push(`BURGLARY ALARM triggered in ${areaName}`);
    }
    if (status.fireTriggered && (this.platform.settings.pushover!.fire ?? false)) {
      messages.push(`FIRE ALARM triggered in ${areaName}`);
    }
    if (status.gasTriggered && (this.platform.settings.pushover!.gas ?? false)) {
      messages.push(`GAS ALARM triggered in ${areaName}`);
    }
    if (status.auxiliaryTriggered && (this.platform.settings.pushover!.auxiliary ?? false)) {
      messages.push(`AUXILIARY ALARM triggered in ${areaName}`);
    }
    if (status.freezeTriggered && (this.platform.settings.pushover!.freeze ?? false)) {
      messages.push(`FREEZE ALARM triggered in ${areaName}`);
    }
    if (status.waterTriggered && (this.platform.settings.pushover!.water ?? false)) {
      messages.push(`WATER ALARM triggered in ${areaName}`);
    }
    if (status.duressTriggered && (this.platform.settings.pushover!.duress ?? false)) {
      messages.push(`DURESS ALARM triggered in ${areaName}`);
    }
    if (status.temperatureTriggered && (this.platform.settings.pushover!.temperature ?? false)) {
      messages.push(`TEMPERATURE ALARM triggered in ${areaName}`);
    }

    return messages;
  }
}