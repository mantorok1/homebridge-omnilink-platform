# Change Log

All notable changes to this project will be documented in this file.

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
