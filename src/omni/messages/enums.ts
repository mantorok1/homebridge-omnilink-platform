
export enum MessageTypes {
  Acknowledge = 0x01,
  NegativeAcknowledge = 0x02,
  EndOfData = 0x03,

  SetTimeCommandRequest = 0x13,
  ControllerCommandRequest = 0x14,
  EnableNotificationsRequest = 0x15,
  SystemInformationRequest = 0x16,
  SystemInformationResponse = 0x17,
  SystemStatusRequest = 0x18,
  SystemStatusResponse = 0x19,
  SystemTroublesRequest = 0x1A,
  SystemTroublesResponse = 0x1B,

  ObjectTypeCapacitiesRequest = 0x1E,
  ObjectTypeCapacitiesResponse = 0x1F,

  ObjectPropertiesRequest = 0x20,
  ObjectPropertiesResponse = 0x21,

  SecurityCodeValidationRequest = 0x26,
  SecurityCodeValidationResponse = 0x27,

  SystemFormatsRequest = 0x28,
  SystemFormatsResponse = 0x29,

  KeypadEmergencyRequest = 0x2C,

  ExtendedObjectStatusRequest = 0x3A,
  ExtendedObjectStatusResponse = 0x3B
}

export enum ObjectTypes {
  Zone = 1,
  Unit = 2,
  Button = 3,
  Code = 4,
  Area = 5,
  Thermostat = 6,
  AuxiliarySensor = 8,
  AccessControlReader = 14,
  AccessControlLock = 15,
}

export enum Commands {
  UnitOff = 0,
  UnitOn = 1,
  BypassZone = 4,
  RestoreZone = 5,
  ExecuteButton = 7,
  UnitLightingLevel = 9,
  Disarm = 48,
  ArmDay = 49,
  ArmNight = 50,
  ArmAway = 51,
  ArmVacation = 52,
  ArmDayInstant = 53,
  ArmNightDelayed = 54,
  SetHeatSetPoint = 66,
  SetCoolSetPoint = 67,
  SetThermostatMode = 68,
  SetHumidifySetPoint = 73,
  SetDehumidifySetPoint = 74,
  LockDoor = 105,
  UnlockDoor = 106,
}

export enum SecurityModes {
  Off = 0,
  Day = 1,
  Night = 2,
  Away = 3,
  Vacation = 4,
  DayInstant = 5,
  NightDelayed = 6,
  ArmingDay = 9,
  ArmingNight = 10,
  ArmingAway = 11,
  ArmingVacation = 12,
  ArmingDayInstant = 13,
  ArmingNightDelayed = 14,
}

export enum Alarms {
  Burglary = 1,
  Fire = 2,
  Gas = 4,
  Auxiliary = 8,
  Freeze = 16,
  Water = 32,
  Duress = 64,
  Temperature = 128
}

export enum AuthorityLevels {
  InvalidCode = 0,
  Master = 1,
  Manager = 2,
  User = 3
}

export enum SystemTroubles {
  Freeze = 1,
  BatteryLow = 2,
  ACPower = 3,
  PhoneLine = 4,
  DigitalCommunicator = 5,
  Fuse = 6
}

export enum EmergencyTypes {
  Burglary = 1,
  Fire = 2,
  Auxiliary = 3
}

export enum ZoneTypes {
  EntryExit = 0,
  Perimeter = 1,
  NightInterior = 2,
  AwayInterior = 3,
  DoubleEntryDelay = 4,
  QuadrupleEntryDelay = 5,
  LatchingPerimeter = 6,
  LatchingNightInterior = 7,
  LatchingAwayInterior = 8,
  Panic = 16,
  PoliceEmergency = 17,
  Duress = 18,
  Tamper = 19,
  LatchingTamper = 20,
  Fire = 32,
  FireEmergency = 33,
  GasAlarm = 34,
  AuxiliaryEmergency = 48,
  Trouble = 49,
  Freeze = 54,
  Water = 55,
  FireTamper = 56,
  Auxiliary = 64,
  KeyswitchInput = 65,
  ProgrammableEnergySaverModule = 80,
  OutdoorTemperature = 81,
  Temperature = 82,
  TemperatureAlarm = 83,
  Humidity = 84,
  ExtendedRangeOutdoorTemperature = 85,
  ExtendedRangeTemperature = 86,
  ExtendedRangeTemperatureAlarm = 87
}

export enum UnitTypes {
  Standard = 1,
  Extended = 2,
  Compose = 3,
  UPB = 4,
  HLCRoom = 5,
  HLCLoad = 6,
  LuminaMode = 7,
  RadioRA = 8,
  CentraLite = 9,
  ViziaRFRoom = 10,
  ViziaRFLoad = 11,
  Flag = 12,
  Output = 13,
  AudioZone = 14,
  AudioSource = 15
}

export enum ThermostatTypes {
  NotUsed = 0,
  AutoHeatCool = 1,
  HeatCool = 2,
  Heat = 3,
  Cool = 4,
  SetPoint = 5
}

export enum AuxiliarySensorTypes {
  ProgrammableEnergySaverModule = 80,
  OutdoorTemperature = 81,
  Temperature = 82,
  TemperatureAlarm = 83,
  Humidity = 84,
  ExtendedRangeOutdoorTemperature = 85,
  ExtendedRangeTemperature = 86,
  ExtendedRangeTemperatureAlarm = 87
}