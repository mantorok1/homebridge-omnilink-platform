# Setup

This plugin requires [Homebridge](https://homebridge.io) (version 1.6 or above) to be installed first. It is highly recommended that you use the Homebridge UI to install and configure the plugin. Alternatively you can do it manually as described below.

## Minimum Requirements
This plugin supports Omni systems that meet the following requirements:
- Connectivity via TCP/IP
- Omni-Link II Protocol
- Firmware 3.0 or higher (4.0b recommended)

## Installation

You can manually install from the command line as follows:

    npm install -g homebridge-omnilink-platform

## Configuration

To configue manully you will need some basic knowledge of JSON. The Homebridge configuration can be found in the `config.json` file.

The following describes each of the available keys for the plugin:

|Key|Required|Type|Description|Default Value (if not supplied)|
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
|`minTemperature`|No|number|The minimum allowed temperature to be shown in the Thermostat accessory (in Celcius)|`0`| 
|`maxTemperature`|No|number|The maximum allowed temperature to be shown in the Thermostat accessory (in Celcius)|`40`|
|`includeHoldStatusSwitches`|No|boolean|Include the Hold Status switches which allow setting a thermostat's hold status|`false`|
|`includeFanModeSwitches`|No|boolean|Include the Fan Mode switches which allow setting a thermostat's fan mode (Auto, On, Cycle)|`false`|
|`includeHumidityControls`|No|boolean|Include the Humidity controls in the HomeKit Thermostat accessory|`false`|
|`targetHumiditySetPointType`|No|number|Selects which type of Omni set point (ie. Humidify or Dehumidify) that HomeKit's Target Humidity will map to<br/>[`1` = Humidify, `2` = Dehumidify]|`1`|
|`targetHumidityDifference`|No|number|The difference between the Humidify and Dehumidify set points. This allows the plugin to set the other Omni humidity set point. `0` means do not set|`0`|
|`defaultAccessoryMappings`|No|object|Defines the default zone and unit HomeKit accessory mappings.<br/>For `zone` and `zoneFireEmergency` the defaults can be either `motion`, `smoke`, `contact`, `carbondioxide`, `carbonmonoxide`, `leak`, `occupancy` or `none`<br/>For `unit` the defaults can be either `switch`, `lightbulb` or `none`|`{"zone": "motion", "zoneFireEmergency": "smoke", "unit": "switch"}`|
|`map`|No|object|See [Map Configuration](#map-configuration)||
|`exclude`|No|object|See [Exclude Configuration](#exclude-configuration)||
|`garageDoors`|No|array|Defines 1 or more garage door accessories. Each definition requires the following properties:<br/><ul><li>`buttonId` - the button number correspnding to the button that opens/closes the door<li>`zoneId` - the zone number corresponding to the sensor that determines if the garage door is closed or not<li>`openTime` - the time taken (in seconds) for the garage door to fully open</ul>Example garage door definition: `{ "buttonId": 2, "zoneId": 3, "openTime": 10 }`||
|`pushover`|No|object|See [Pushover Notification Configuration](./mqtt.md#configuration)||
|`mqtt`|No|object|See [MQTT Configuration](./mqtt.md#configuration)||
|`syncTime`|No|boolean|Sync the controller's date and time with the Homebridge host|`false`|
|`showHomebridgeEvents`|No|boolean|Show Homebridge events in the Homebridge log|`false`|
|`showOmniEvents`|No|boolean|Show Omni notification events in the Homebridge log|`false`|
|`excludeZoneStatusChanges`|No|boolean|Exclude Zone Status changes from the log|`false`|
|`excludeTemperatureChanges`|No|boolean|Exclude Temperature and Humidity changes from the log|`false`|
|`showRequestResponse`|No|boolean|Show requests to and responses from controller in the Homebridge log|`false`|
|`clearCache`|No|boolean|Clear all the plugin's cached accessories from homebridge to force re-creation of HomeKit accessories on restart<br/>This is equivalent to deleting the `cachedAccessories` file|`false`|
|`forceAutoDiscovery`|No|boolean|Force auto-discovery of Omni-Link devices on restart<br/>This is equivalent to deleting the `OmnilinkPlatform.json` file|`false`|

>**TIP:** The area, zone, button, unit and themostat numbers are displayed in the Homebridge logs when it starts up.

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
|`switch`|No|string|List of the unit numbers that are to be mapped to Switches. Useful for units that only support On/Off states|
|`lightbulb`|No|string|List of the unit numbers that are to be mapped to Lightbulbs. Useful for units that control dimmable lights|

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

### Example Configuration

```
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
        "excludeZoneStatusChanges": false,
        "excludeTemperatureChanges": false,
        "showRequestResponse": false,
        "clearCache": false,
        "forceAutoDiscovery": false
      }
    ],
    ...
```
