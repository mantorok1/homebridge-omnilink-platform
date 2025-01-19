# Change Log

All notable changes to this project will be documented in this file.

# 1.5.19 (2025-01-19)

* Add Window Covering accessory type for Omni units
* Update dependencies, one of which had a high severity vulnerability

# 1.5.18 (2024-08-24)

* Add support for Homebridge 2.0 Beta
* Add support for node 22.x and remove support for 16.x
* Update dependencies, one of which had a moderate severity vulnerability

# 1.5.17 (2024-07-20)

* Add log message for Remote Key Selected (Audio Zones)
* Update dependencies, some of which had high severity vulnerabilities

## 1.5.16 (2024-02-25)

* Add Mute Characteristic to Audio Zones (used in Remote app)
* Update dependencies

## 1.5.15 (2024-01-27)

* [FIX] Audio Zone volume not being set correctly ([#33](https://github.com/mantorok1/homebridge-omnilink-platform/issues/33))

## 1.5.14 (2024-01-06)

* Minor fixes to documentation & Thermostat logging

## 1.5.13 (2023-12-28)

* Add switches to control a thermostat's hold status & fan mode
* Improved documentation
* Update dependencies

## 1.5.12 (2023-11-18)

* Support node 20.x and remove support for 14.x
* Update dependencies

## 1.5.11 (2023-04-22)

* Setting thermostat temperature will firstly turn off Hold mode (if on), set the temperature and then turn Hold mode back on ([#27](https://github.com/mantorok1/homebridge-omnilink-platform/issues/27))
* Support thermostat Hold mode in MQTT
* Update dependencies

## 1.5.10 (2023-04-10)

* Add UI configuration for multiple instances of plugin ([#25](https://github.com/mantorok1/homebridge-omnilink-platform/issues/25))
* [FIX] Failed pushover notification causes plugin to crash
* Check status of all objects every minute in case of missed Omni events
* Add ability to exclude "unimportant" Omni notification events from logs ([#21](https://github.com/mantorok1/homebridge-omnilink-platform/issues/21))
* Update dependencies, one of which had a high severity vulnerability

## 1.5.9 (2023-01-14)

* Update dependencies

## 1.5.8 (2022-11-13)

* [FIX] Support unnamed security codes for Zone Bypass switches
* Support node 18.x and remove support for 12.x
* Update dependencies

## 1.5.7 (2022-09-17)

* [FIX] Support unnamed security codes ([#20](https://github.com/mantorok1/homebridge-omnilink-platform/issues/20))
* Update dependencies

## 1.5.6 (2022-07-31)

* Add minimum and maximum allowed temperature to Thermostat accessory
* Update dependencies, some of which had moderate severity vulnerabilities

## 1.5.5 (2022-03-27)

* Update dependencies, one of which had a high severity vulnerability

## 1.5.4 (2022-02-13)

* Add Television accessories for Omni Audio Zones & Sources

## 1.5.3 (2022-01-27)

* Auto discovery of Omni Audio Sources & Zones. **NOTE:** No integration with HomeKit yet

## 1.5.2 (2022-01-23)

* Update dependencies, one of which had a high severity vulnerability

## 1.5.1 (2022-01-09)

* Remove build on node 10.x
* Update dependencies

## 1.5.0 (2021-12-30)

* **BREAKING CHANGE**: Remove support for the following settings:
  - `sensors` [Zone Sensor Settings]
  - `units` [Unit Accessory Settings]
  - `map.zones.none` [Zone Accessory Mappings &gt; None]
  - `map.units.none` [Unit Accessory Mappings &gt; None]
* Use newer promise-based characteristic getters and setters (onGet & onSet). Requires Homebridge version 1.3.0 or above.
* Improvements to error handling
* Update dependencies, some of which had moderate severity vulnerabilities

## 1.4.5 (2021-08-07)

|:warning: **Upcoming Breaking Change**|
|---|
|The following settings will not be supported in the next version of the plugin. This version has removed them from the Homebridge Config UI although they are still recognised by the plugin. If you have not already done so please update your settings to use the new Mapping and Exclusion configurations if necessary.<br/><ul><li>Zone Sensor Settings</li><li>Unit Accessory Settings</li><li>Zone Accessory Mappings &gt; None</li><li>Unit Accessory Mappings &gt; None</li></ul>|

* Add timeout to requests that take more than 10 seconds to respond
* Remove deprecated settings from `config.schema.json` and `README` files

## 1.4.4 (2021-06-14)

* Code refactor to improve performance
* Allow exclusions of areas, zones, units, buttons, thermostats, auxiliary sensors & access controls
* Update dependencies, one of which had a high severity vulnerability

## 1.4.3 (2021-05-30)

* Update dependencies, one of which had a high severity vulnerability

## 1.4.2 (2021-05-30)

* Reduce calls to Omni controller when HomeKit/Homebridge requests accessory status updates
* Miscellaneous minor improvements

## 1.4.1 (2021-05-16)

* Add build on node 16.x
* [FIX] Wait for Omni connection before configuring cached accessories
* Support multiple cache files to allow more than 1 connection to Omni controller(s) via Child Bridges
* Support Humidity control for Thermostat accessories
* Minor improvements to some log messages (such as temperature display)
* [FIX] Auto-Discovery not finding auxiliary sensors

## 1.4.0 (2021-04-16)

* Lock Mechanism accessories for Omni access controls
* Temperature & Humidity Sensor accessories for Omni auxiliary sensors ([#5](https://github.com/mantorok1/homebridge-omnilink-platform/issues/5))
* Show Request/Response in Homebridge logs
* Improvements to mapping zones and units to HomeKit accessories in settings ([#4](https://github.com/mantorok1/homebridge-omnilink-platform/issues/4))

## 1.3.4 (2021-03-07)

* Use platformAccessory display name as service name
* Support platformAccessory Identify event
* Cache discovered area, zone, unit, button, thermostat & code IDs for faster startup
* [FIX] Pushover notification may cause plugin to crash when internet connection is down
* Switch accessories for Bypass Zones

## 1.3.3 (2020-12-30)

* Switch accessories for Omni Emergency Alarms

## 1.3.2 (2020-12-24)

* Update dependencies, one of which had a low severity vulnerability

## 1.3.1 (2020-11-22)

* Prevent garage door open/close command if currently in opening/closing state
* Support brightness level for Omni units
* Minor improvements to MQTT

## 1.3.0 (2020-11-14)

* Switch or Lightbulb accessories for Omni units
* Thermostat accessories for Omni thermostats

## 1.2.0 (2020-10-25)

* Improve Event logging
* Handle cancellation of Pushover Emergency Priorty Retries on disarm
* SecuritySystemTargetState only set if different & ZoneStatus code refactor
* Sync time only if times differ by more than 60 secs & check hourly
* Support pushover notifications for system troubles
* Support for MQTT

## 1.1.1 (2020-10-04)

* [FIX] Garage Door opens when requested to close (and vice versa)

## 1.1.0 (2020-10-04)

* Sync Omni controller's date and time with Homebridge host
* New sensors supported: Carbon Dioxide, Carbon Monoxide, Leak, Occupancy
* Pushover notifications
* New logging options
* Update dependencies

## 1.0.0 (2020-09-28)

* Homebridge dynamic platform
* Security System accessories for Omni areas
* Motion, Smoke & Contact Sensor accessories for Omni zones
* Switch accessories for Omni buttons
* Optional Garage Door Opener accessories
