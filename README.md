# Omni-Link Platform

[![npm](https://badgen.net/npm/v/homebridge-omnilink-platform) ![npm](https://badgen.net/npm/dt/homebridge-omnilink-platform)](https://www.npmjs.com/package/homebridge-omnilink-platform) [![verified-by-homebridge](https://badgen.net/badge/homebridge/verified/purple)](https://github.com/homebridge/homebridge/wiki/Verified-Plugins)

This Homebridge Plugin allows you to control a HAI/Leviton Omni series Security & Home Automation System via the Omni-Link II protocol over a TCP/IP connection.

Functions available:
* Arm/disarm the security system
* Notify when alarm system is triggered
* Notify when sensors are tripped (7 types of sensors supported)
* Notify when system has troubles (eg. AC Power)
* Execute buttons
* Turn units (such as switches and lights) on/off
* Control thermostats
* Open/close garage doors
* Activate emergency alarms (burglary, fire & auxiliary)
* Sync Omni controller's date & time with Homebridge host
* Pushover notifications when alarms are triggered or system has troubles
* MQTT client (see section "MQTT Client" for further details)

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
|`Unit`|`Switch`|
|`Thermostat`|`Thermostat`|
|`Emergency Alarms`|`Switch` (1 per area and emergency type)|

The zones can be overriden to another type of sensor. Currently the plugin supports `Motion`, `Smoke`, `Contact`, `Carbon Dioxide`, `Carbon Monoxide`, `Leak` and `Occupancy` sensors.

Units can also be overriden as a `Lightbulb` accessory.

A combination of a button and zone can also be defined as a `Garage Door Opener`.

## Installation
Note: This plugin requires [Homebridge](https://homebridge.io) (version 1.0.0 or above) to be installed first.

It is highly recommended that you use [Homebridge Config UI X](https://www.npmjs.com/package/homebridge-config-ui-x) to install and configure the plugin. Alternatively you can install from the command line as follows:

    npm install -g homebridge-omnilink-platform

## Configuration
This is a platform plugin that will register accessories and their services with the bridge provided by Homebridge. The plugin will attempt to discover your Omni controller's objects (ie. zones, areas, buttons) automatically thus requiring minimal configuration to the `config.json` file.

If you find the default config is not correct for your system or not to your liking there are some overrides you can define in the `config.json` file.

|Option|Required|Type|Description|Default Value (if not supplied)|
|-|-|-|-|-|
|`platform`|Yes|string|Must be `"OmniLinkPlatform"`||
|`name`|Yes|string|The name of the platform|`"Omni"`|
|`address`|Yes|string|IP Address of the controller||
|`port`|Yes|number|Port of the controller|`4369`|
|`key1`|Yes|string|First part of the hexadecimal private key<br/>Format: 00-00-00-00-00-00-00-00||
|`key2`|Yes|string|Second part of the hexadecimal private key<br/>Format: 00-00-00-00-00-00-00-00||
|`includeAreas`|No|boolean|Include all enabled areas from the Omni controller. Each area will be added as a "Security System" accessory|`true`|
|`includeZones`|No|boolean|Include all named zones from the Omni controller. Each zone will be added as a "Sensor" accessory. By default a zone with a type of `Fire Emergency` will shown as a "Smoke Sensor" and all other types will be shown as a "Motion Sensor"|`true`|
|`includeButtons`|No|boolean|Include all named buttons from the Omni controller. Each button will be added as a "Switch" accessory|`true`|
|`includeUnits`|No|boolean|Include all named units from the Omni controller. Each unit will be added as a "Switch" accessory by default|`true`|
|`includeThermostats`|No|boolean|Include all named thermostats from the Omni controller. Each thermostat will be added as a "Thermostat" accessory|`true`|
|`includeEmergencyAlarms`|No|boolean|Include emergency alarms (ie. burglary, fire and auxiliary). Each alarm for each area will be added as a "Switch" accessory|`true`|
|`setHomeAsAway`|No|boolean|Changes the security mode to "Away" if "Home" is selected. This may be useful if you don't use the "Home" mode and want to ensure the alarm is set to "Away" if accidently set to "Home"|`false`|
|`setNightAsAway`|No|boolean|Changes the security mode to "Away" if "Night" is selected. Likewise, useful if you don't use the "Night" mode|`false`|
|`securityCode`|No|string|The 4 digit security code used to arm and disarm the security system. Without this the security system cannot be operated||
|`sensors`|No|array|Defines 1 or more sensor accessories. This can be useful to override a sensor as the default one is incorrect. Each sensor definition requires the following properties:<br/><ul><li>`zoneId` - the zone number corresponding to the sensor<li>`sensorType` - type of Homekit sensor accessory to use (valid options: `motion`, `smoke`, `contact`, `carbondioxide`, `carbonmonoxide`, `leak`, `occupancy`). Any other value will remove the accessory</ul>Example sensor definition: `{ "zoneId": 2, "sensorType": "contact" }`||
|`garageDoors`|No|array|Defines 1 or more garage door accessories. Each definition requires the following properties:<br/><ul><li>`buttonId` - the button number correspnding to the button that opens/closes the door<li>`zoneId` - the zone number corresponding to the sensor that determines if the garage door is closed or not<li>`openTime` - the time taken (in seconds) for the garage door to fully open</ul>Example garage door definition: `{ "buttonId": 2, "zoneId": 3, "openTime": 10 }`||
|`units`|No|array|Defines 1 or more unit accessories. This can be useful to override a unit as the default one is incorrect. Each unit definition requires the following properties:<br/><ul><li>`unitId` - the unit number corresponding to the unit<li>`type` - type of Homekit accessory to use (valid options: `switch`, `lightbulb`). Any other value will remove the accessory</ul>Example unit definition: `{ "unitId": 2, "type": "lightbulb" }`||
|`pushover`|No|object|See 'Pushover Notification Configuration' below||
|`mqtt`|No|object|See 'MQTT Configuration' below||
|`syncTime`|No|boolean|Sync the controller's date and time with the Homebridge host|`false`|
|`showHomebridgeEvents`|No|boolean|Show Homebridge events in the Homebridge log|`false`|
|`showOmniEvents`|No|boolean|Show Omni notification events in the Homebridge log|`false`|
|`clearCache`|No|boolean|Clear all the plugin's cached accessories from homebridge to force re-creation of HomeKit accessories on restart<br/>This is equivalent to deleting the `cachedAccessories` file|`false`|
|`forceAutoDiscovery`|No|boolean|Force auto-discovery of Omni-Link devices on restart<br/>This is equivalent to deleting the `OmnilinkPlatform.json` file|`false`|

*TIP:* The area, zone, button, unit and themostat numbers are displayed in the Homebridge logs when it starts up.

### Pushover Notification Configuration
This plugin can be configured to send Push notifications to your phone when alarms are trigggered or the system encounters troubles. To do this you'll need a [Pushover](https://pushover.net) account. The following describes the configuration options available:

|Option|Required|Type|Description|Default Value (if not supplied)|
|-|-|-|-|-|
|`token`|Yes|string|Application API Token supplied by Pushover||
|`users`|Yes|array|One or more User Keys supplied by Pushover. Each user will receive a push notification||
|`alarms`|No|object|Specifies which triggered alarms will send a push notification. The following alarm types can be specified: `burglary`, `fire`, `gas`, `auxiliary`, `freeze`, `water`, `duress` and `temperature`.<br/>Each alarm type has a value of either `true` or `false`||
|`troubles`|No|object|Specifies which system troubles will send a push notification. The following troubles can be specified: `freeze`, `batterylow`, `acpower`, `phoneline`, `digitalcommunicator` and `fuse`.<br/>Each trouble has a value of either `true` or `false`||

### MQTT Configuration

Option|Required|Type|Description|Default Value (if not supplied)|
|-|-|-|-|-|
|`host`|Yes|string|MQTT Broker host name||
|`port`|Yes|number|MQTT Broker port|`1883`|
|`username`|No|string|Credentials for MQTT Broker||
|`password`|No|string|||
|`topicPrefix`|No|string|Optional text to prefix to each topic name||
|`showMqttEvents`|No|boolean|Include MQTT events in the logs|`false`|

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
        "includeUnits": true,
        "includeThermostats": true,
        "includeEmergencyAlarms": true,
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
        "units": [
          {
            "unitId": 32,
            "type": "lightbulb"
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
        "mqtt": {
          "host": "mqtt://192.168.1.111",
          "port": 1883,
          "username": "mantorok",
          "password": "password",
          "topicPrefix": "omni",
          "showMqttEvents": true
        },
        "syncTime": true,
        "showHomebridgeEvents": true,
        "showOmniEvents": true,
        "clearCache": false
      }
    ],
    ...

## MQTT Client
The plugin is able to operate as an MQTT client. It publishes various topics containing information about the Omni controller which other clients can subscribe to. It also subscribes to topics allowing other clients to send commands to the controller. This can be useful for interacting with external applications such as [Home Assistant](https://www.home-assistant.io) and [Node-RED](https://nodered.org).

Published topics end with `/get` and subscribed topics end with `/set`

### Area Topics
|Topic|Description|Payload|
|-|-|-|
|`area/{number}/name/get`|Gets the name of area `{number}`|string| 
|`area/{number}/arm/get`|Gets the armed state of area `{number}`|"off", "away", "night", "day" "vacation", "day_instant", "night_delayed"|
|`area/{number}/arm/set`|Sets the armed state of area `{number}`<br/>(0 = all areas)|"off", "away", "night", "day", "vacation", "day_instant", "night_delayed"|
|`area/{number}/burglary/get`|Gets the triggered state of the burglary alarm of area `{number}`|"true", "false"|
|`area/{number}/fire/get`|Gets the triggered state of the fire alarm of area `{number}`|"true", "false"|
|`area/{number}/gas/get`|Gets the triggered state of the gas alarm of area `{number}`|"true", "false"|
|`area/{number}/auxiliary/get`|Gets the triggered state of the auxiliary alarm of area `{number}`|"true", "false"|
|`area/{number}/freeze/get`|Gets the triggered state of the freeze alarm of area `{number}`|"true", "false"|
|`area/{number}/water/get`|Gets the triggered state of the water alarm of area `{number}`|"true", "false"|
|`area/{number}/duress/get`|Gets the triggered state of the duress alarm of area `{number}`|"true", "false"|
|`area/{number}/temperature/get`|Gets the triggered state of the temperature alarm of area `{number}`|"true", "false"|
|`area/{number}/alarm/set`|Activates emergency alarm of area `{number}`|"burglary", "fire", "auxiliary"| 

### Zone Topics
|Topic|Description|Payload|
|-|-|-|
|`zone/{number}/name/get`|Gets the name of zone `{number}`|string| 
|`zone/{number}/ready/get`|Gets the ready state of zone `{number}`|"true", "false"|
|`zone/{number}/trouble/get`|Gets the trouble state of zone `{number}`|"true", "false"|

### Button Topics
|Topic|Description|Payload|
|-|-|-|
|`button/{number}/name/get`|Gets the name of button `{number}`|string| 
|`button/{number}/execute/set`|Executes button `{number}`|"true"|

### Unit Topics
|Topic|Description|Payload|
|-|-|-|
|`unit/{number}/name/get`|Gets the name of unit `{number}`|string| 
|`unit/{number}/state/get`|Gets the state of unit `{number}`|"on", "off"|
|`unit/{number}/state/set`|Sets the state of unit `{number}`|"on", "off"|
|`unit/{number}/brightness/get`|Gets the brightness level of unit `{number}`|number<br/>(see note)|
|`unit/{number}/brightness/set`|Sets the brightness level of unit `{number}`|number<br/>(see note)|

Note: Brightness level is specified as an integer between 0 and 100 inclusive

### Thermostat Topics
|Topic|Description|Payload|
|-|-|-|
|`thermostat/{number}/name/get`|Gets the name of thermostat `{number}`|string| 
|`thermostat/{number}/mode/get`|Gets the mode of thermostat `{number}`|"off", "heat", "cool", "auto", "emergencyheat"|
|`thermostat/{number}/mode/set`|Sets the mode of thermostat `{number}`|"off", "heat", "cool", "auto", "emergencyheat"|
|`thermostat/{number}/state/get`|Gets the state of thermostat `{number}`|"idle", "heating", "cooling"|
|`thermostat/{number}/temperature/get`|Gets the current temperature of thermostat `{number}`|number<br/>(see note 1)|
|`thermostat/{number}/coolsetpoint/get`|Gets the Cooling SetPoint of thermostat `{number}`|number<br/>(see note)|
|`thermostat/{number}/coolsetpoint/set`|Sets Cooling Set Point of thermostat `{number}`|number<br/>(see note)|
|`thermostat/{number}/heatsetpoint/get`|Gets the Heating SetPoint of thermostat `{number}`|number<br/>(see note)|
|`thermostat/{number}/heatsetpoint/set`|Sets Heating Set Point of thermostat `{number}`|number<br/>(see note)|

Note: Temperatures are specified in either Celsius or Fahrenheit depending on how your Omni controller is configured.

### System Topics
|Topic|Description|Payload|
|-|-|-|
|`system/troubles/freeze/get`|Gets the freeze state of the system|"true", "false"|
|`system/troubles/batterylow/get`|Gets the battery low state of the system|"true", "false"|
|`system/troubles/acpower/get`|Gets the AC power state of the system.|"true", "false"|
|`system/troubles/phoneline/get`|Gets the phone line state of the system|"true", "false"|
|`system/troubles/digitalcommunicator/get`|Gets the digital communicator state of the system|"true", "false"|
|`system/troubles/fuse/get`|Gets the fuse state of the system|"true", "false"|

## Version History
See [Change Log](CHANGELOG.md).

## Known Limitations
* I've only been able to test this plugin using my own system. I can't guarantee it will work on others.
* Thermostats were not able to be tested as my system doesn't have any. If you encounter any bugs please raise an issue on GitHub and I'll attempt to fix it ASAP.
* This plugin only supports a subset of the functionality provided by the Omni-Link II protocol. If there's specific functionality you'd like to see included with this plugin please raise an issue on GitHub and I'll see what I can do. I may need you to assist with beta testing though.
