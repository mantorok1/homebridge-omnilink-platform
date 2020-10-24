# Omni-Link Platform

[![npm](https://badgen.net/npm/v/homebridge-omnilink-platform) ![npm](https://badgen.net/npm/dt/homebridge-omnilink-platform)](https://www.npmjs.com/package/homebridge-omnilink-platform) [![verified-by-homebridge](https://badgen.net/badge/homebridge/verified/purple)](https://github.com/homebridge/homebridge/wiki/Verified-Plugins)

This Homebridge Plugin allows you to control a HAI/Leviton Omni Security & Home Automation System via the Omni-Link II protocol over a TCP/IP connection.

Functions available:
* Arm/disarm the security system
* Notify when alarm system is triggered
* Notify when sensors are tripped (7 types of sensors supported)
* Execute buttons
* Open/close garage doors
* Sync Omni controller's date & time with Homebridge host
* Pushover notifications when alarms are triggered or system has troubles

## Minimum Requirements
This plugin supports Omni systems that meet the following requirements:
* Connectivity via TCP/IP
* Omni-Link II Protocol
* Firmware 3.0 or higher (earlier versions may partially work)

## Accessories
The plugin will discover what features your system has and create Homekit accessories for them. The following are the currently supported Omni-Link objects and the default Homekit accessory they map to.

|Omni-Link Object|Homekit Accessory|
|-|-|
|`Area`|`Security System` (1 per area)|
|`Zone` (Fire Emergency)|`Smoke Sensor`|
|`Zone` (all other types)|`Motion Sensor`|
|`Button`|`Switch`|

The zones can be overriden to another type of sensor. Currently the plugin supports `Motion`, `Smoke`, `Contact`, `Carbon Dioxide`, `Carbon Monoxide`, `Leak` and `Occupancy` sensors.

A combination of a button and zone can also be defined as a `Garage Door Opener`.

## Installation
Note: This plugin requires Homebridge (version 1.0.0 or above) to be installed first.

It is highly recommended that you use Homebridge Config UI X to install and configure the plugin. Alternatively you can install from the command line as follows:

    npm install -g homebridge-omnilink-plugin

## Configuration
This is a platform plugin that will register accessories and their services with the bridge provided by Homebridge. The plugin will attempt to discover your Omni system's objects (ie. zones, areas, buttons) automatically thus requiring minimal configuration to the `config.json` file.

If you find the default config is not correct for your system or not to your liking there are some overrides you can define in the `config.json` file.

|Option|Required|Type|Description|Default Value (if not supplied)|
|-|-|-|-|-|
|`platform`|Yes|string|Must be `"OmniLinkPlatform"`||
|`name`|No|string|The name of the platform|`"Omni"`|
|`address`|Yes|string|IP Address of the controller||
|`port`|Yes|number|Port of the controller|`4369`|
|`key1`|Yes|string|First part of the hexadecimal private key<br/>Format: 00-00-00-00-00-00-00-00||
|`key2`|Yes|string|Second part of the hexadecimal private key<br/>Format: 00-00-00-00-00-00-00-00||
|`includeAreas`|No|boolean|Include all enabled areas from the Omni controller. Each area will be added as a "Security System" accessory|`true`|
|`includeZones`|No|boolean|Include all named zones from the Omni controller. Each zone will be added as a "Sensor" accessory. By default a zone with a type of `Fire Emergency` will shown as a "Smoke Sensor" and all other types will be shown as a "Motion Sensor"|`true`|
|`includeButtons`|No|boolean|Include all named buttons from the Omni controller. Each button will be added as a "Switch" accessory|`true`|
|`setHomeAsAway`|No|boolean|Changes the security mode to "Away" if "Home" is selected. This may be useful if you don't use the "Home" mode and want to ensure the alarm is set to "Away" if accidently set to "Home"|`false`|
|`setNightAsAway`|No|boolean|Changes the security mode to "Away" if "Night" is selected. Likewise, useful if you don't use the "Night" mode|`false`|
|`securityCode`|No|string|The 4 digit security code used to arm and disarm the security system. Without this the security system cannot be operated||
|`sensors`|No|array|Defines 1 or more sensor accessories. This can be useful to override a sensor as the default one is incorrect. Each sensor definition requires the following properties:<br/><ul><li>`zoneId` - the zone number corresponding to the sensor<li>`sensorType` - type of Homekit sensor accessory to use (valid options: `motion`, `smoke`, `contact`, `carbondioxide`, `carbonmonoxide`, `leak`, `occupancy`). Any other value will remove the accessory</ul>Example sensor definition: `{ "zoneId": 2, "sensorType": "contact" }`||
|`garageDoors`|No|array|Defines 1 or more garage door accessories. Each definition requires the following properties:<br/><ul><li>`buttonId` - the button number correspnding to the button that opens/closes the door<li>`zoneId` - the zone number corresponding to the sensor that determines if the garage door is closed or not<li>`openTime` - the time taken (in seconds) for the garage door to fully open</ul>Example garage door definition: `{ "buttonId": 2, "zoneId": 3, "openTime": 10 }`||
|`pushover`|No|object|See 'Pushover Notification Configuration' below||
|`syncTime`|No|boolean|Sync the controller's date and time with the Homebridge host|`false`|
|`showHomebridgeEvents`|No|boolean|Show Homebridge events in the Homebridge log|`false`|
|`showOmniEvents`|No|boolean|Show Omni notification events in the Homebridge log|`false`|
|`clearCache`|No|boolean|Clear all the plugin's cached accessories from Homebridge to force full discovery of accessories on restart|`false`|

*TIP:* The area, zone and button numbers are displayed in the Homebridge logs when it starts up.

### Pushover Notification Configuration
This plugin can be configured to send Push notifications to your phone when alarms are trigggered. To do this you'll need a [Pushover](https://pushover.net) account. The following describes the configuration options available:

|Option|Required|Type|Description|Default Value (if not supplied)|
|-|-|-|-|-|
|`token`|Yes|string|Application API Token supplied by Pushover||
|`users`|Yes|array|One or more User Keys supplied by Pushover. Each user will receive a push notification||
|`alarms`|No|object|Specifies which triggered alarms will send a push notification. The following alarm types can be specified: `burglary`, `fire`, `gas`, `auxiliary`, `freeze`, `water`, `duress` and `temperature`.<br/>Each alarm type has a value of either `true` or `false`||
|`troubles`|No|object|Specifies which system troubles will send a push notification. The following troubles can be specified: `freeze`, `batterylow`, `acpower`, `phoneline`, `digitalcommunicator` and `fuse`.<br/>Each trouble has a value of either `true` or `false`||

#### Example:

    "platforms": [
      {
        "platform": "OmniLinkPlatform",
        "name": "OmniPro",
        "address": "10.0.0.200",
        "port": 4369,
        "key1": "00-00-00-00-00-00-00-00",
        "key2": "00-00-00-00-00-00-00-00",
        "includeAreas": true,
        "includeZones": true,
        "includeButtons": true,
        "setHomeToAway": true,
        "setNightToAway": true,
        "securityCode": "0000",
        "sensors": [
          {
            "zoneId": 7,
            "sensorType": "contact"
          },
          {
            "zoneId": 8,
            "sensorType": "carbondioxide"
          }        
        ],
        "garageDoors": [
          {
            "buttonId": 2,
            "zoneId": 11,
            "openTime": 10
          },
          {
            "buttonId": 3,
            "zoneId": 12,
            "openTime": 10
          }
        ],
        "pushover": {
          "token": "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
          "users": [
              "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
              "cccccccccccccccccccccccccccccc"
          ],
          "alarms": {
            "burglary": true,
            "fire": true,
            "gas": false,
            "auxiliary": false,
            "freeze": false,
            "water": false,
            "duress": false,
            "temperature": false
          },
          "troubles": {
            "freeze": false,
            "batterylow": false,
            "acpower": false,
            "phoneline": true,
            "digitalcommunicator": false,
            "fuse": false
          }
        },
        "syncTime": true,
        "showHomebridgeEvents": true,
        "showOmniEvents": true,
        "clearCache": false
      }
    ],
    ...

## Version History
See [Change Log](CHANGELOG.md).

## Known Limitations
* I've only been able to test this plugin using my own system. I can't guarantee it will work on others.
* This plugin only supports a subset of the functionality provided by the Omni-Link II protocol
