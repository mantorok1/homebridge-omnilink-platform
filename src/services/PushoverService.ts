import Pushover = require('pushover-notifications');
import fetch = require('node-fetch');

import { OmniLinkPlatform } from '../platform';
import { AreaStatus, Alarms } from '../models/AreaStatus';

export class PushoverService {
  private pushover;
  private readonly token?: string;
  private readonly users: string[] = [];
  private readonly receipts: Map<string, string[]> = new Map();

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

  sendMessage(areaName: string, areaStatus: AreaStatus): void {
    this.platform.log.debug(this.constructor.name, 'sendMessage', areaName, areaStatus);

    try {

      this.cancelMessage(areaName);

      if (areaStatus.alarmsTriggered.length === 0) {
        return;
      }

      const pushoverMessage = {
        title: `${this.platform.settings.name} - ${areaName}`,
        message: '',
        sound: 'siren',
        priority: 2,  // Emergency Priorty
        expire: 600,  // 10 minutes
        retry: 60,    // 1 minute
        user: '',
      };

      const alarms = areaStatus.alarmsTriggered.map((alarm) => Alarms[alarm].toUpperCase());
      const message = `${alarms.join()} Alarm${alarms.length > 1 ? 's' : ''} Triggered`;

      for (const user of this.users) {
        pushoverMessage.message = message;
        pushoverMessage.user = user;

        this.pushover.send(pushoverMessage, (error, result) => {
          if (error) {
            throw error;
          }
          const receipt = JSON.parse(result).receipt;
          if (this.receipts.has(areaName)) {
            this.receipts.get(areaName)?.push(receipt);
          } else {
            this.receipts.set(areaName, [receipt]);
          }
        });
      }
    } catch(error) {
      this.platform.log.warn('Pushover notification(s) failed:', error.message);
    }
  }

  async cancelMessage(areaName: string): Promise<void> {
    this.platform.log.debug(this.constructor.name, 'cancelMessage', areaName);

    try {
      if (!this.receipts.has(areaName) || this.receipts.get(areaName)!.length === 0) {
        return;
      }

      const receipts = this.receipts.get(areaName)!;
      const body = {token: this.token};

      for(const receipt of receipts) {
        await fetch.default(`https://api.pushover.net/1/receipts/${receipt}/cancel.json`, {
          method: 'post',
          body: JSON.stringify(body),
          headers: { 'Content-Type': 'application/json' },
        });
      }

      this.receipts.delete(areaName);
    } catch(error) {
      this.platform.log.warn('Cancel Pushover notification failed:', error.message);
    }
  }
}