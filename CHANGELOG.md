# Change Log

All notable changes to this project will be documented in this file.

## NEXT

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
