
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
  AudioSource = 9,
  AudioZone = 10,
  AccessControl = 14,
}

export enum ObjectStatusTypes {
  Zone = 1,
  Unit = 2,
  Area = 5,
  Thermostat = 6,
  AuxiliarySensor = 8,
  AudioZone = 10,
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
  SetThermostatFanMode = 69,
  SetThermostatHoldState = 70,
  SetHumidifySetPoint = 73,
  SetDehumidifySetPoint = 74,
  LockDoor = 105,
  UnlockDoor = 106,
  SetAudioZoneState = 112,
  SetAudioZoneVolume = 113,
  SetAudioZoneSource = 114 
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

export enum EmergencyTypes {
  Burglary = 1,
  Fire = 2,
  Auxiliary = 3
}

export enum AudioZoneCommandStates {
  Off = 0,
  On = 1,
  MuteOff = 2,
  MuteOn = 3
}