
export enum MessageTypes {
  Acknowledge = 0x01,
  NegativeAchnowledge = 0x02,
  EndOfData = 0x03,

  SetTimeCommandRequest = 0x13,
  ControllerCommandRequest = 0x14,
  EnableNotificationsRequest = 0x15,
  SystemInformationRequest = 0x16,
  SystemInformationResponse = 0x17,

  ObjectTypeCapacitiesRequest = 0x1E,
  ObjectTypeCapacitiesResponse = 0x1F,

  ObjectPropertiesRequest = 0x20,
  ObjectPropertiesResponse = 0x21,

  SecurityCodeValidationRequest = 0x26,
  SecurityCodeValidationResponse = 0x27,

  ExtendedObjectStatusRequest = 0x3A,
  ExtendedObjectStatusResponse = 0x3B
}

export enum ObjectTypes {
  Zone = 1,
  Button = 3,
  Code = 4,
  Area = 5,
}

export enum Commands {
  ExecuteButton = 7,
  Disarm = 48,
  ArmDay = 49,
  ArmNight = 50,
  ArmAway = 51
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