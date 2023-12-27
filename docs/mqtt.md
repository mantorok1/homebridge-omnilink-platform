# MQTT Client
The plugin is able to operate as an MQTT client. It publishes various topics containing information about the Omni controller which other clients can subscribe to. It also subscribes to topics allowing other clients to send commands to the controller. This can be useful for interacting with external applications such as [Home Assistant](https://www.home-assistant.io) and [Node-RED](https://nodered.org).

## Configuration

It is recommended to use the Homebridge UI to configure the MQTT client which can be found in the "MQTT Settings" section within the Homebrudge UI. You can also manually configure it in the JSON config file using the following keys:

|Key|Required|Type|Description|Default Value (if not supplied)|
|-|-|-|-|-|
|`host`|Yes|string|MQTT Broker host name||
|`port`|Yes|number|MQTT Broker port|`1883`|
|`username`|No|string|Credentials for MQTT Broker||
|`password`|No|string|||
|`topicPrefix`|No|string|Optional text to prefix to each topic name||
|`showMqttEvents`|No|boolean|Include MQTT events in the logs|`false`|

### Example:
```
  "mqtt": {
    "host": "mqtt://192.168.1.111",
    "port": 1883,
    "username": "mantorok",
    "password": "password",
    "topicPrefix": "omni",
    "showMqttEvents": true
  },
```

## Topics

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
|`thermostat/{number}/fan/get`|Gets the Fan mode of thermostat `{number}`|"auto", "on", "cycle"|
|`thermostat/{number}/fan/set`|Gets the Fan mode of thermostat `{number}`|"auto", "on", "cycle"|
|`thermostat/{number}/hold/get`|Gets the Hold state of thermostat `{number}`|"off", "hold", "vacationhold"|
|`thermostat/{number}/hold/set`|Sets the Hold state of thermostat `{number}`|"off", "hold", "vacationhold"|

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