# Omni-Link Platform

[![npm](https://badgen.net/npm/v/homebridge-omnilink-platform?icon=npm&label)](https://www.npmjs.com/package/homebridge-omnilink-platform)
[![npm](https://badgen.net/npm/dt/homebridge-omnilink-platform)](https://www.npmjs.com/package/homebridge-omnilink-platform)
[![verified-by-homebridge](https://badgen.net/badge/homebridge/verified/purple)](https://github.com/homebridge/homebridge/wiki/Verified-Plugins)
[![npm](https://badgen.net/badge/paypal/mantorok1/yellow)](https://paypal.me/Mantorok1)
[![npm](https://badgen.net/discord/online-members/8fpZA4S?icon=discord&label=discord)](https://discord.com/channels/432663330281226270/922725736584994847)

This Homebridge Plugin allows you to control a HAI/Leviton Omni series Security & Home Automation System via the Omni-Link II protocol over a TCP/IP connection.

Functions available:
- Arm/disarm the security system
- Notify when alarm system is triggered
- Notify when sensors are tripped (7 types of sensors supported)
- Notify when system has troubles (eg. AC Power)
- Execute buttons
- Turn units (such as switches and lights) on/off
- Control thermostats
- Open/close garage doors
- Activate emergency alarms (burglary, fire & auxiliary)
- Bypass zones
- Lock/unlock doors
- Notify temperature/humidity from auxiliary sensors
- Control audio zones
- Sync Omni controller's date & time with Homebridge host
- Pushover notifications when alarms are triggered or system has troubles
- MQTT client

For further details see:
- [Setup](./docs/setup.md)
- [Accessories](./docs/accessories.md)
- [Pushover Notifications](./docs/pushover.md)
- [MQTT](./docs/mqtt.md)
- [Version History](./CHANGELOG.md)
- [Troubleshooting](./docs/troubleshooting.md)
- [License](./LICENSE)
