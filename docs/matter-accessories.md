# Matter Accessories (BETA)

This plugin now supports registering Matter accessories with the bridge provided by Homebridge. This will allow you to use non-Apple home automation controllers such as Google Home & Amazon Alexa. The plugin will attempt to discover your Omni controller's objects (i.e. zones, areas, buttons, etc.) automatically and create equivalent Matter accessories.

See [Enabling Matter](https://github.com/homebridge-plugins/homebridge-matter/wiki/Enabling-Matter) for details on how to set it up.

**NOTES:**
 - Matter support is still in Beta and does not support all the accessory types that HomeKit does. In particular it does not support `Security System`, `Garage Door Opener` and `Television` accessories which this plugin requires for some functionality
 - I am not able to test all the accessory types as my Omni system does not have them. If you encounter a bug please [raise an issue](https://github.com/mantorok1/homebridge-omnilink-platform/issues) on GitHub.


|Omni Object Type|Available Matter Accessory|Supported|
|-|-|-|
|[Area](#area)|N/A|No|
|[Emergency Alarms](#emergency-alarm)|`Switch`|Yes|
|[Zone](#zone)|`Motion/Occupancy Sensor`<br/>`Smoke/CO Sensor`<br/>`Contact Sensor`<br/>`Leak Sensor`|Yes|
|[Bypass Zone](#bypass-zone)|`Switch`|Yes|
|[Button](#button)|`Switch`|Yes|
|[Unit](#unit)|`Switch`<br/>`Dimmable Light`<br/>`Window Covering`|Yes|
|[Thermostat](#thermostat)|`Thermostat`|Partial|
|[Auxiliary Sensor](#auxiliary-sensor)|`Temperature Sensor`<br/>`Humidity Sensor`|Yes|
|[Access Contol](#access-control)|`Door Lock`|Yes|
|[Audio Zone](#audio-zone)|N/A|No|


## Area

Security Systems are not currently supported by Matter.

## Zone

Each zone can be configured to be one of the four sensors listed above. By default each zone will be created as a `Motion Sensor` with the exception of a "Fire Emergency" zone which will be created as a `Smoke Sensor`. These defaults can be changed or you can configure each individual zone to be a specific type of sensor. See [configuration](setup.md) for more details.

When a `Smoke/CO Sensor` is added then 2 seperate sensors (`Smoke` and `Carbon Monoxide`) are created but only the `Smoke Sensor` is currently functional.

If a zone is configured as an `Occupancy Sensor` then it will be created as a `Motion Sensor`.

If a zone is configured as `Carbon Monoxide Sensor` or `Carbon Dioxide Sensor` then it will created as a `Smoke/CO Sensor`

`Garage Door Opener` is not currently supported by Homebridge's Matter implementation.

## Emergency Alarm

An emergency alarm can be created as a `Switch` (1 per area and emergency type). Putting the switch into the On state will immediately trigger the corresponding alarm.

## Bypass Zone

A `Switch` can be created for each zone allowing you to toggle the bypassing of the zone.

## Button

A `Switch` accessory is created for each Button. As a button has no state (i.e. neither On nor Off) the switch will always be in the Off state. Moving the switch into the On state will "run" the button and the switch will return to the Off state.

`Garage Door Opener` is not currently supported by Homebridge's Matter implementation.

## Unit

By default a unit will be created as a `Switch` which can be either On or Off. Other options are:
- `Dimmable Light` for lights which allow you to also control the brightness level
- `Window Covering` for blinds etc. which allow you to control the position 

## Thermostat

Each thermostat will create a `Thermostat` accessory. This allows you to control the temperature and the mode (i.e. off, heat, cool, auto) of your HVAC.

Humidity control is not currently supported by Homebridge's Matter implementation. 

The Omni Hold, Fan On & Fan Cycle functionality has not been implemented and may get added in a future version of the plugin. 

## Auxiliary Sensor

Each Auxiliary sensor can be created as either a `Temperature Sensor` for sensors that report temperature or a `Humidity Sensor` for sensors that report humidity.

## Access Control

Each Access Control can be created as a `Door Lock` to allow you to lock/unlock doors, gates etc.

## Audio Zone

Audio Systems are not currently supported by Homebridge's Matter implementation. 
