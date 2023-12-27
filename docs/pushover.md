# Pushover Notifications

This plugin supports sending Push notifications to your iPhone (or other devices) when alarms are trigggered or the system encounters troubles. To do this you'll need to create a [Pushover](https://pushover.net/signup) account and install the Pushover app. Note that there is a [one-time purchase](https://pushover.net/pricing) cost for doing this.

## Configuration

It is recommended to use the Homebridge UI to configure the Pushover Notifications which can be found in the "Pushover Notifications" section within the Homebridge UI. You can also manually configure it in the JSON config file using the following keys:

|Key|Required|Type|Description|Default Value (if not supplied)|
|-|-|-|-|-|
|`token`|Yes|string|Application API Token supplied by Pushover||
|`users`|Yes|array|One or more User Keys supplied by Pushover. Each user will receive a push notification||
|`alarms`|No|object|Specifies which triggered alarms will send a push notification. The following alarm types can be specified: `burglary`, `fire`, `gas`, `auxiliary`, `freeze`, `water`, `duress` and `temperature`.<br/>Each alarm type has a value of either `true` or `false`||
|`troubles`|No|object|Specifies which system troubles will send a push notification. The following troubles can be specified: `freeze`, `batterylow`, `acpower`, `phoneline`, `digitalcommunicator` and `fuse`.<br/>Each trouble has a value of either `true` or `false`||

### Example:
```
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
```