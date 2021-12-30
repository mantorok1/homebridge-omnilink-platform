# Omni-Link Platform

[![npm](https://badgen.net/npm/v/homebridge-omnilink-platform?icon=npm&label)](https://www.npmjs.com/package/homebridge-omnilink-platform)
[![npm](https://badgen.net/npm/dt/homebridge-omnilink-platform)](https://www.npmjs.com/package/homebridge-omnilink-platform)
[![verified-by-homebridge](https://badgen.net/badge/homebridge/verified/purple)](https://github.com/homebridge/homebridge/wiki/Verified-Plugins)
[![npm](https://badgen.net/badge/paypal/mantorok1/yellow)](https://paypal.me/Mantorok1)
[![npm](https://badgen.net/discord/online-members/8fpZA4S?icon=discord&label=discord)](https://discord.com/channels/432663330281226270/922725736584994847)

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
* Bypass zones
* Lock/unlock doors
* Notify temperature/humidity from auxiliary sensors
* Sync Omni controller's date & time with Homebridge host
* Pushover notifications when alarms are triggered or system has troubles
* MQTT client (see section "MQTT Client" for further details)

## Minimum Requirements
This plugin supports Omni systems that meet the following requirements:
* Connectivity via TCP/IP
* Omni-Link II Protocol
* Firmware 3.0 or higher

## Accessories
The plugin will discover what features your system has and create HomeKit accessories for them. The following are the currently supported Omni-Link objects and the available HomeKit accessories they can map to.

|Omni-Link Object|Available HomeKit Accessory|
|-|-|
|`Area`|`Security System` (1 per area)|
|`Zone`|`Motion Sensor` (default)<br/>`Smoke Sensor` (default for fire emergency)<br/>`Contact Sensor`<br/>`Carbon Dioxide Sensor`<br/>`Carbon Monoxide Sensor`<br/>`Leak Sensor`<br/>`Occupancy Sensor`<br/>`Garage Door Opener` (when used with a button)|
|`Button`|`Switch` (stateless)<br/>`Garage Door Opener` (when used with a zone)|
|`Unit`|`Switch` (default)<br/>`Lightbulb` (dimmable)|
|`Thermostat`|`Thermostat`|
|`Emergency Alarms`|`Switch` (1 per area and emergency type)|
|`Bypass Zone`|`Switch`|
|`Access Contol`|`Lock Mechanism`|
|`Auxiliary Sensor`|`Temperature Sensor` (for sensors that report temperature)<br/>`Humidity Sensor` (for sensors that report humidity)|

## Installation
Note: This plugin requires [Homebridge](https://homebridge.io) (version 1.3.0 or above) to be installed first.

It is highly recommended that you use [Homebridge Config UI X](https://www.npmjs.com/package/homebridge-config-ui-x) to install and configure the plugin. Alternatively you can install from the command line as follows:

    npm install -g homebridge-omnilink-platform

## Configuration
This is a platform plugin that will register accessories and their services with the bridge provided by Homebridge. The plugin will attempt to discover your Omni controller's objects (ie. zones, areas, buttons, etc.) automatically thus requiring minimal configuration to the `config.json` file.

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
|`includeZones`|No|boolean|Include all named zones from the Omni controller. Each zone will be added as a "Sensor" accessory|`true`|
|`includeBypassZones`|No|boolean|Include bypass for named zones. Each zone bypass will be added as a "Switch" accessory|`false`|
|`includeButtons`|No|boolean|Include all named buttons from the Omni controller. Each button will be added as a "Switch" accessory|`true`|
|`includeUnits`|No|boolean|Include all named units from the Omni controller|`true`|
|`includeThermostats`|No|boolean|Include all named thermostats from the Omni controller. Each thermostat will be added as a "Thermostat" accessory|`true`|
|`includeEmergencyAlarms`|No|boolean|Include emergency alarms (ie. burglary, fire and auxiliary). Each alarm for each area will be added as a "Switch" accessory|`true`|
|`includeAccessControls`|No|boolean|Include all named Access Controls. Each access control will be added as a "Lock Mechanism" accessory|`true`|
|`includeAuxiliarySensors`|No|boolean|Include all named Auxiliary Sensors. Each auxiliary sensor will be added as either a "Temperature Sensor" or "Humidity Sensor" accessory|`true`|
|`setHomeAsAway`|No|boolean|Changes the security mode to "Away" if "Home" is selected. This may be useful if you don't use the "Home" mode and want to ensure the alarm is set to "Away" if accidently set to "Home"|`false`|
|`setNightAsAway`|No|boolean|Changes the security mode to "Away" if "Night" is selected. Likewise, useful if you don't use the "Night" mode|`false`|
|`securityCode`|No|string|The 4 digit security code used to arm and disarm the security system. Without this the security system cannot be operated||
|`includeHumidityControls`|No|boolean|Include the Humidity controls in the HomeKit Thermostat accessory|`false`|
|`targetHumiditySetPointType`|No|number|Selects which type of Omni set point (ie. Humidify or Dehumidify) that HomeKit's Target Humidity will map to<br/>[`1` = Humidify, `2` = Dehumidify]|`1`|
|`targetHumidityDifference`|No|number|The difference between the Humidify and Dehumidify set points. This allows the plugin to set the other Omni humidity set point. `0` means do not set|`0`|
|`defaultAccessoryMappings`|No|object|Defines the default zone and unit HomeKit accessory mappings.<br/>For `zone` and `zoneFireEmergency` the defaults can be either `motion`, `smoke`, `contact`, `carbondioxide`, `carbonmonoxide`, `leak`, `occupancy` or `none`<br/>For `unit` the defaults can be either `switch`, `lightbulb` or `none`|`{"zone": "motion", "zoneFireEmergency": "smoke", "unit": "switch"}`|
|`map`|No|object|See 'Map Configuration' below||
|`exclude`|No|object|See 'Exclude Configuration' below||
|`garageDoors`|No|array|Defines 1 or more garage door accessories. Each definition requires the following properties:<br/><ul><li>`buttonId` - the button number correspnding to the button that opens/closes the door<li>`zoneId` - the zone number corresponding to the sensor that determines if the garage door is closed or not<li>`openTime` - the time taken (in seconds) for the garage door to fully open</ul>Example garage door definition: `{ "buttonId": 2, "zoneId": 3, "openTime": 10 }`||
|`pushover`|No|object|See 'Pushover Notification Configuration' below||
|`mqtt`|No|object|See 'MQTT Configuration' below||
|`syncTime`|No|boolean|Sync the controller's date and time with the Homebridge host|`false`|
|`showHomebridgeEvents`|No|boolean|Show Homebridge events in the Homebridge log|`false`|
|`showOmniEvents`|No|boolean|Show Omni notification events in the Homebridge log|`false`|
|`showRequestResponse`|No|boolean|Show requests to and responses from controller in the Homebridge log|`false`|
|`clearCache`|No|boolean|Clear all the plugin's cached accessories from homebridge to force re-creation of HomeKit accessories on restart<br/>This is equivalent to deleting the `cachedAccessories` file|`false`|
|`forceAutoDiscovery`|No|boolean|Force auto-discovery of Omni-Link devices on restart<br/>This is equivalent to deleting the `OmnilinkPlatform.json` file|`false`|

*TIP:* The area, zone, button, unit and themostat numbers are displayed in the Homebridge logs when it starts up.

**NOTE:**  Config options `sensors` & `units` may be removed in a future version of the plugin. Please migrate to the new `map` option ASAP.

### Map Configuration
Defines how Omni zones and units are to be mapped to HomeKit accessories. This can be useful to override an accessory if the default one is not the correct type or you wish to exclude it from HomeKit.

|Option|Required|Type|Description|
|-|-|-|-|
|`zones`|No|object|Contains the zone mappings (see below)|
|`units`|No|object|Contains the unit mappings (see below)|

Zone Mappings
|Option|Required|Type|Description|
|-|-|-|-|
|`motion`|No|string|List of the zone numbers that are to be mapped to Motion Sensors|
|`smoke`|No|string|List of the zone numbers that are to be mapped to Smoke Sensors|
|`contact`|No|string|List of the zone numbers that are to be mapped to Contact Sensors|
|`carbondioxide`|No|string|List of the zone numbers that are to be mapped to Carbon Dioxide Sensors|
|`carbonmonoxide`|No|string|List of the zone numbers that are to be mapped to Carbon Monoxide Sensors|
|`leak`|No|string|List of the zone numbers that are to be mapped to Leak Sensors|
|`occupancy`|No|string|List of the zone numbers that are to be mapped to Occupancy Sensors|

Unit Mappings
|Option|Required|Type|Description|
|-|-|-|-|
|`switch`|No|string|List of the unit numbers that are to be mapped to Switches|
|`lightbulb`|No|string|List of the unit numbers that are to be mapped to Lightbulbs|

NOTE: The lists are to be supplied as comma seperated (eg. `"1,2,3"`)

### Exclude Configuration
Defines which Omni objects (areas, zones etc) are to be excluded when creating HomeKit accessories

|Option|Required|Type|Description|
|-|-|-|-|
|`areas`|No|string|List of the area numbers that are to be excluded|
|`zones`|No|string|List of the zone numbers that are to be excluded|
|`units`|No|string|List of the unit numbers that are to be excluded|
|`buttons`|No|string|List of the button numbers that are to be excluded|
|`thermostats`|No|string|List of the thermostat numbers that are to be excluded|
|`auxiliarySensors`|No|string|List of the auxiliary sensor numbers that are to be excluded|
|`accessControls`|No|string|List of the access control numbers that are to be excluded|

NOTE: The lists are to be supplied as comma seperated (eg. `"1,2,3"`)

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
        "includeBypassZones": true,
        "includeButtons": true,
        "includeUnits": true,
        "includeThermostats": true,
        "includeEmergencyAlarms": true,
        "includeAccessControls": true,
        "includeAuxiliarySensors": true,
        "setHomeToAway": true,
        "setNightToAway": true,
        "securityCode": "0000",
        "defaultAccessoryMappings": {
          "zone": "motion",
          "zoneFireEmergency": "smoke",
          "unit": "switch"
        },
        "map": {
          "zones": {
            "contact": "1,2,3",
            "occupancy": "6"
          },
          "units": {
            "lightbulb": "1,3"
          }
        },
        "exclude": {
          "zones": "7,8,9",
          "units": "6,7",
          "buttons": "4"
        },
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
        "showRequestResponse": false,
        "clearCache": false,
        "forceAutoDiscovery": false
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
|`zone/{number}/bypass/get`|Gets the bypass state of zone `{number}`|"true", "false"|
|`zone/{number}/bypass/set`|Sets the bypass state of zone `{number}`|"true", "false"|

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
|`thermostat/{number}/temperature/get`|Gets the current temperature of thermostat `{number}`|number<br/>(see note)|
|`thermostat/{number}/coolsetpoint/get`|Gets the Cooling Set Point of thermostat `{number}`|number<br/>(see note)|
|`thermostat/{number}/coolsetpoint/set`|Sets the Cooling Set Point of thermostat `{number}`|number<br/>(see note)|
|`thermostat/{number}/heatsetpoint/get`|Gets the Heating Set Point of thermostat `{number}`|number<br/>(see note)|
|`thermostat/{number}/heatsetpoint/set`|Sets the Heating Set Point of thermostat `{number}`|number<br/>(see note)|
|`thermostat/{number}/humidity/get`|Gets the current humidity of thermostat `{number}`|number<br/>(0 - 100)|
|`thermostat/{number}/humidifysetpoint/get`|Gets the Humidify Set Point of thermostat `{number}`|number<br/>(0 - 100)|
|`thermostat/{number}/humidifysetpoint/set`|Sets the Humidify Set Point of thermostat `{number}`|number<br/>(0 - 100)|
|`thermostat/{number}/dehumidifysetpoint/get`|Gets the Dehumidify Set Point of thermostat `{number}`|number<br/>(0 - 100)|
|`thermostat/{number}/dehumidifysetpoint/set`|Sets the Dehumidify Set Point of thermostat `{number}`|number<br/>(0 - 100)|

Note: Temperatures are specified in either Celsius or Fahrenheit depending on how your Omni controller is configured.

### Access Control Topics
|Topic|Description|Payload|
|-|-|-|
|`accesscontrol/{number}/name/get`|Gets the name of access control `{number}`|string| 
|`accesscontrol/{number}/locked/get`|Gets the locked state of access control `{number}`|"true", "false"|
|`accesscontrol/{number}/locked/set`|Sets the locked state of access control `{number}`|"true", "false"|

### Auxiliary Sensor Topics
|Topic|Description|Payload|
|-|-|-|
|`auxiliary/{number}/name/get`|Gets the name of auxiliary sensor `{number}`|string| 
|`auxiliary/{number}/temperature/get`|Gets the temperature of auxiliary sensor `{number}`|number<br/>(see note)|
|`auxiliary/{number}/humidity/get`|Gets the humidity of auxiliary sensor `{number}`|number|

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

## Known Limitations / Troubleshooting
* I've only been able to test this plugin using my own system. I can't guarantee it will work on others.
* Thermostats, Access Controls & Auxiliary Sensors were not able to be tested as my system doesn't have any. If you encounter any bugs please raise an issue on GitHub and I'll attempt to fix it ASAP.
* This plugin only supports a subset of the functionality provided by the Omni-Link II protocol. If there's specific functionality you'd like to see included with this plugin please raise an issue on GitHub and I'll see what I can do. I may need you to assist with beta testing though.
* There is a limit of 149 HomeKit accessories on a single Bridge which includes those from other plugins. If you have a lot of accessories it is recommended that you run this plugin in a [Child Bridge](https://github.com/homebridge/homebridge/wiki/Child-Bridges).
* If you see a lot of Homebridge log messages such as the `[homebridge-omnilink-platform] This plugin slows down Homebridge` after installing/upgrading the plugin try restarting Homebridge.
