# Accessories

This is a platform plugin that will register HomeKit accessories and their services with the bridge provided by Homebridge. The plugin will attempt to discover your Omni controller's objects (i.e. zones, areas, buttons, etc.) automatically and create equivalent HomeKit accessories.

|Omni Object Type|Available HomeKit Accessory|
|-|-|
|[Area](#area)|`Security System`|
|[Emergency Alarms](#emergency-alarm)|`Switch`|
|[Zone](#zone)|`Motion Sensor`<br/>`Smoke Sensor`<br/>`Contact Sensor`<br/>`Carbon Dioxide Sensor`<br/>`Carbon Monoxide Sensor`<br/>`Leak Sensor`<br/>`Occupancy Sensor`<br/>`Garage Door Opener`|
|[Bypass Zone](#bypass-zone)|`Switch`|
|[Button](#button)|`Switch`<br/>`Garage Door Opener`|
|[Unit](#unit)|`Switch`<br/>`Lightbulb`|
|[Thermostat](#thermostat)|`Thermostat` and `Switches`|
|[Auxiliary Sensor](#auxiliary-sensor)|`Temperature Sensor`<br/>`Humidity Sensor`|
|[Access Contol](#access-control)|`Lock Mechanism`|
|[Audio Zone](#audio-zone)|`Television`|

## Area

A `Security System` accessory is created for each Area. This allows you to arm and disarm your security system.

## Emergency Alarm

An emergency alarm can be created as a `Switch` (1 per area and emergency type). Putting the switch into the On state will immeditately trigger the corresponding alarm.

## Zone

Each zone can be configured to be one of the seven sensors listed above. By default each zone will be created as a `Motion Sensor` with the exception of a "Fire Emergency" zone which will be created as a `Smoke Sensor`. These defaults can be changed or you can configure each individual zone to be a specific type of sensor. See [configuration](setup.md) for more details.

A zone can also be used in combination with a button to create a `Garage Door Opener`. When this is the case the zone is not able to be used as sensor. See [Button](#button) for more details.

## Bypass Zone

A `Switch` can be created for each zone allowing you to toggle the bypassing of the zone.

## Button

A `Switch` accessory is created for each Button. As a button has no state (i.e. neither On nor Off) the switch will always be in the Off state. Moving the switch into the On state will "run" the button and the switch will immediately return to the Off state.

A button can also be configured to be a `Garage Door Opener`. This has the benefit of being able to open/close the garage door from CarPlay. For this to work there needs to be a zone that can be used to determine the state of the garage door (i.e. Open or Closed). When configured in this way the zone and button will not be able to be used as a `Sensor` or `Switch` respectively.

## Unit

By default a unit will be created as a `Switch` which can be either On or Off. If you have a dimmable light then you can configure the unit to a `Lightbulb` which allows you to control the brightness level as well.

## Thermostat

Each thermostat will create a `Thermostat` accessory. This allows you to control the temperature, humidity and the mode (i.e. off, heat, cool, auto) of your HVAC.

The HomeKit `Thermostat` only supports a single Set Point for humidity, however, Omni supports a humidity range between two Set Points. To support this you can nominate which Omni Set Point the HomeKit `Thermostat` should use and what the difference is between the 2 set points. If you change the HomeKit humidity set point then it will update both set points on the Omni unless you specify the difference to be zero, in this case only the norminated set point which change.

The Omni thermostat has additinal functionality that is not supported by the HomeKit `Thermostat`. To workaround this additional `Switch` accessories can be create to control the hold status and fan mode as follows:

- **Hold**: When On then hold status is On
- **Fan On**: When On then fan mode is On
- **Fan Cycle**: When On then fan mode is Cycle

Note: When both Fan On and Fan Cycle switches are Off then the fan mode is Auto.

## Auxiliary Sensor

Each Auxiliary sensor can be created as either a `Temperature Sensor` for sensors that report temperature or a `Humidity Sensor` for sensors that report humidity.

## Access Control

Each Access Control can be created as a `Lock Mechanism` to allow you lock/unlock doors, gates etc.

## Audio Zone

Each audio zone is configured as a `Television` accessory (shown with a speaker icon) in HomeKit. Volume controls are not supported within the Home app so you need to use the Remote app in the Control Center to do this. Here's a list of the functions available for both apps:

### Home App
|Action|Description|
|-|-|
|Power|Turn Audio Zone On or Off|
|Sources|Select the Audio Source for the zone|

### Remote App (in Control Center)
Select the Audio Zone you want to control from the Drop Down at the top of the screen
|Action|Descripton|
|-|-|
|Up Arrow (or Volume Up button)|Increase volume by 10%|
|Down Arrow (or Volume Down button)|Decrease volume by 10%|
|Mute (or Select)|Toggle Mute On and Off|
|Left Arrow|Change Audio Source by cycling backwards|
|Right Arrow|Change Audio Source by cycling forwards|
|Play/Pause|Toggle Power On and Off|

### How to add an Audio Zone:
Each audio zone is published as an external accessory so it needs to be added manually the first time (unlike other types of accessories that are automatically added). To do this follow these steps for **each** Audio Zone:
1. Open the Home app and tap the `+` button at the top left
2. Then select `Add Accessory`
3. Select `More options...` and the Audio Zones should be shown
4. Select one of them and tap `Add Anyway`
5. Enter your 8 digit Homebridge code and tap `Continue`
6. After a short while you will be asked a few questions such as its location, name, sources. Just tap `Continue` on each of these
7. Finally you should get to the point that the Audio Zone has been added. Tap on either `Done` or `View in Home` and you're finished

### How to remove an Audio Zone:
If you no longer want to see the Audio Zone in the Home app follow these steps:
1. Find the accessory you want to remove in the Home app
2. Tap and hold the accessory tile until it opens up
3. Swipe up until you see the `Remove Accessory` button at the bottom
4. Tap the button and then tap `Remove` to confirm

### Troubleshooting
After removing an Audio Zone there are some Homebridge files which may need to be manually deleted before you can re-add the accessory again. If you don't see your Audio Zone when following the 'How to add an Audio Zone' procedure above try the following:
1. Navigate to the `persist` folder in Homebridge. Here you should see a number of files named `AccessoryInfo.xxxxxxxxxxxx.json` (where xxxxxxxxxxxx is some hexidecimal number)
2. Open up each one in a text editor until you find the one that corresponds to the Audio Zone you are trying to add. You can see its name at the top after `displayName`. Example: `{"displayName":"My Audio Zone ...`
3. Take note of the hexidecimal number in the filename
4. Now delete the `AccessoryInfo.xxxxxxxxxxxx.json` and `IdentifierCache.xxxxxxxxxxxx.json` files with the hexidecimal number from the previous step
5. Restart Homebridge

