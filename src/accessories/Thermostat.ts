import { CharacteristicValue, PlatformAccessory } from 'homebridge';
import { OmniLinkPlatform } from '../platform';
import { AccessoryBase } from './AccessoryBase';
import { TemperatureFormats } from '../models/SystemFormats';
import { ThermostatStatus, ThermostatTypes, ThermostatModes } from '../models/Thermostat';
import { OmniObjectStatusTypes } from '../models/OmniObjectBase';

export class Thermostat extends AccessoryBase {
  private heaterTypes = [ThermostatTypes.AutoHeatCool, ThermostatTypes.HeatCool, ThermostatTypes.Heat];
  private coolerTypes = [ThermostatTypes.AutoHeatCool, ThermostatTypes.HeatCool, ThermostatTypes.Cool];
  private minTemperature: number;
  private maxTemperature: number;

  constructor(
    platform: OmniLinkPlatform,
    platformAccessory: PlatformAccessory,   
  ) {
    super(platform, platformAccessory);

    const service = this.platformAccessory.getService(this.platform.Service.Thermostat);
    if (service) {
      this.service = service;
    } else {
      this.service = this.platformAccessory.addService(this.platform.Service.Thermostat, platformAccessory.displayName);
      this.initialiseService();
    }

    this.minTemperature = this.service.getCharacteristic(this.platform.Characteristic.TargetTemperature).props.minValue ?? 10;
    this.maxTemperature = this.service.getCharacteristic(this.platform.Characteristic.TargetTemperature).props.maxValue ?? 30;

    this.setEventHandlers();
  }

  static type = 'Thermostat';

  initialiseService() {
    this.platform.log.debug(this.constructor.name, 'initialiseService');

    let validStates = this.getValidCurrentHeatingCoolingStates();
    this.service
      .getCharacteristic(this.platform.Characteristic.CurrentHeatingCoolingState)
      .setProps({
        minValue: Math.min(...validStates),
        maxValue: Math.max(...validStates),
        validValues: validStates,
      });

    validStates = this.getValidTargetHeatingCoolingStates();
    this.service
      .getCharacteristic(this.platform.Characteristic.TargetHeatingCoolingState)
      .setProps({
        minValue: Math.min(...validStates),
        maxValue: Math.max(...validStates),
        validValues: validStates,
      });
  }

  getValidCurrentHeatingCoolingStates(): number[] {
    this.platform.log.debug(this.constructor.name, 'getValidCurrentHeatingCoolingStates');

    const thermostatType = this.platform.omniService.omni.thermostats[this.platformAccessory.context.index].type;
    const validStates: number[] = [this.platform.Characteristic.CurrentHeatingCoolingState.OFF];
    if (this.heaterTypes.includes(thermostatType)) {
      validStates.push(this.platform.Characteristic.CurrentHeatingCoolingState.HEAT);
    }
    if (this.coolerTypes.includes(thermostatType)) {
      validStates.push(this.platform.Characteristic.CurrentHeatingCoolingState.COOL);
    }
    return validStates;
  }

  getValidTargetHeatingCoolingStates(): number[] {
    this.platform.log.debug(this.constructor.name, 'getValidTargetHeatingCoolingStates');

    const thermostatType = this.platform.omniService.omni.thermostats[this.platformAccessory.context.index].type;
    const validStates: number[] = [this.platform.Characteristic.TargetHeatingCoolingState.OFF];
    if (this.heaterTypes.includes(thermostatType)) {
      validStates.push(this.platform.Characteristic.TargetHeatingCoolingState.HEAT);
    }
    if (this.coolerTypes.includes(thermostatType)) {
      validStates.push(this.platform.Characteristic.TargetHeatingCoolingState.COOL);
    }
    if (thermostatType === ThermostatTypes.AutoHeatCool) {
      validStates.push(this.platform.Characteristic.TargetHeatingCoolingState.AUTO);
    }

    return validStates;
  }

  setEventHandlers(): void {
    this.platform.log.debug(this.constructor.name, 'setEventHandlers');

    this.service
      .getCharacteristic(this.platform.Characteristic.CurrentHeatingCoolingState)
      .onGet(this.getCharacteristicValue.bind(this, this.getCurrentHeatingCoolingState.bind(this), 'CurrentHeatingCoolingState'));

    this.service
      .getCharacteristic(this.platform.Characteristic.TargetHeatingCoolingState)
      .onGet(this.getCharacteristicValue.bind(this, this.getTargetHeatingCoolingState.bind(this), 'TargetHeatingCoolingState'))
      .onSet(this.setCharacteristicValue.bind(this, this.setTargetHeatingCoolingState.bind(this), 'TargetHeatingCoolingState'));

    this.service
      .getCharacteristic(this.platform.Characteristic.CurrentTemperature)
      .onGet(this.getCharacteristicValue.bind(this, this.getCurrentTemperature.bind(this), 'CurrentTemperature'));

    this.service
      .getCharacteristic(this.platform.Characteristic.TargetTemperature)
      .onGet(this.getCharacteristicValue.bind(this, this.getTargetTemperature.bind(this), 'TargetTemperature'))
      .onSet(this.setCharacteristicValue.bind(this, this.setTargetTemperature.bind(this), 'TargetTemperature'));

    this.service
      .getCharacteristic(this.platform.Characteristic.TemperatureDisplayUnits)
      .onGet(this.getCharacteristicValue.bind(this, this.getTemperatureDisplayUnits.bind(this), 'TemperatureDisplayUnits'));

    this.service
      .getCharacteristic(this.platform.Characteristic.CoolingThresholdTemperature)
      .onGet(this.getCharacteristicValue.bind(this, this.getCoolingThresholdTemperature.bind(this), 'CoolingThresholdTemperature'))
      .onSet(this.setCharacteristicValue.bind(this, this.setCoolingThresholdTemperature.bind(this), 'CoolingThresholdTemperature'));

    this.service
      .getCharacteristic(this.platform.Characteristic.HeatingThresholdTemperature)
      .onGet(this.getCharacteristicValue.bind(this, this.getHeatingThresholdTemperature.bind(this), 'HeatingThresholdTemperature'))
      .onSet(this.setCharacteristicValue.bind(this, this.setHeatingThresholdTemperature.bind(this), 'HeatingThresholdTemperature'));

    if (this.platform.settings.includeHumidityControls) {
      this.service
        .getCharacteristic(this.platform.Characteristic.CurrentRelativeHumidity)
        .onGet(this.getCharacteristicValue.bind(this, this.getCurrentRelativeHumidity.bind(this), 'CurrentRelativeHumidity'));

      this.service
        .getCharacteristic(this.platform.Characteristic.TargetRelativeHumidity)
        .onGet(this.getCharacteristicValue.bind(this, this.getTargetRelativeHumidity.bind(this), 'TargetRelativeHumidity'))
        .onSet(this.setCharacteristicValue.bind(this, this.setTargetRelativeHumidity.bind(this), 'TargetRelativeHumidity'));
    }

    this.platform.omniService.on(
      this.platform.omniService.getEventKey(OmniObjectStatusTypes.Thermostat, this.platformAccessory.context.index),
      this.updateValues.bind(this));
  }

  private getCurrentHeatingCoolingState(): CharacteristicValue {
    this.platform.log.debug(this.constructor.name, 'getCurrentHeatingCoolingState');

    const thermostatStatus = this.platform.omniService.omni.thermostats[this.platformAccessory.context.index].status;
    if (thermostatStatus === undefined) {
      return this.platform.Characteristic.CurrentHeatingCoolingState.OFF;
    }

    return this.getCurrentHeatingCoolingStateCharacteristicValue(thermostatStatus);
  }

  private getCurrentHeatingCoolingStateCharacteristicValue(status: ThermostatStatus): CharacteristicValue {
    if (status.isHeating()) {
      return this.platform.Characteristic.CurrentHeatingCoolingState.HEAT;
    } else if (status.isCooling()) {
      return this.platform.Characteristic.CurrentHeatingCoolingState.COOL;
    } else {
      return this.platform.Characteristic.CurrentHeatingCoolingState.OFF;
    }
  }

  private getTargetHeatingCoolingState(): CharacteristicValue {
    this.platform.log.debug(this.constructor.name, 'getTargetHeatingCoolingState');

    const thermostatStatus = this.platform.omniService.omni.thermostats[this.platformAccessory.context.index].status;
    if (thermostatStatus === undefined) {
      return this.platform.Characteristic.TargetHeatingCoolingState.OFF;
    }

    return this.getTargetHeatingCoolingStateCharacteristicValue(thermostatStatus);
  }

  private getTargetHeatingCoolingStateCharacteristicValue(status: ThermostatStatus): CharacteristicValue {
    switch (status.mode) {
      case ThermostatModes.Heat:
      case ThermostatModes.EmergencyHeat:
        return this.platform.Characteristic.TargetHeatingCoolingState.HEAT;
      case ThermostatModes.Cool:
        return this.platform.Characteristic.TargetHeatingCoolingState.COOL;
      case ThermostatModes.Auto:
        return this.platform.Characteristic.TargetHeatingCoolingState.AUTO;
      default:
        return this.platform.Characteristic.TargetHeatingCoolingState.OFF;
    } 
  }

  private async setTargetHeatingCoolingState(value: CharacteristicValue): Promise<void> {
    this.platform.log.debug(this.constructor.name, 'getTargetHeatingCoolingState', value);

    let mode = ThermostatModes.Off;
    switch (value) {
      case this.platform.Characteristic.TargetHeatingCoolingState.HEAT:
        mode = ThermostatModes.Heat;
        break;
      case this.platform.Characteristic.TargetHeatingCoolingState.COOL:
        mode = ThermostatModes.Cool;
        break;
      case this.platform.Characteristic.TargetHeatingCoolingState.AUTO:
        mode = ThermostatModes.Auto;
        break;
    }

    await this.platform.omniService.setThermostatMode(this.platformAccessory.context.index, mode);
  }

  private getCurrentTemperature(): CharacteristicValue {
    this.platform.log.debug(this.constructor.name, 'getCurrentTemperature');

    const thermostatStatus = this.platform.omniService.omni.thermostats[this.platformAccessory.context.index].status;
    if (thermostatStatus === undefined) {
      return this.platform.settings.minTemperature;
    }

    return this.getCurrentTemperatureCharacteristicValue(thermostatStatus);
  }

  private getCurrentTemperatureCharacteristicValue(thermostatStatus: ThermostatStatus): number {
    let currentTemperature = thermostatStatus.temperature.toCelcius();
    currentTemperature = Math.max(currentTemperature, this.platform.settings.minTemperature);
    currentTemperature = Math.min(currentTemperature, this.platform.settings.maxTemperature);

    return currentTemperature;
  }

  private getTargetTemperature(): CharacteristicValue {
    this.platform.log.debug(this.constructor.name, 'getTargetTemperature');

    const thermostatStatus = this.platform.omniService.omni.thermostats[this.platformAccessory.context.index].status;
    if (thermostatStatus === undefined) {
      return this.minTemperature;
    }

    return this.getTargetTemperatureCharacteristicValue(thermostatStatus);
  }

  private getTargetTemperatureCharacteristicValue(thermostatStatus: ThermostatStatus): number {
    return thermostatStatus.mode === ThermostatModes.Cool
      ? Math.min(thermostatStatus.coolSetPoint.toCelcius(), this.maxTemperature)
      : Math.max(thermostatStatus.heatSetPoint.toCelcius(), this.minTemperature);
  }

  private async setTargetTemperature(value: CharacteristicValue): Promise<void> {
    this.platform.log.debug(this.constructor.name, 'setTargetTemperature', value);

    const thermostatStatus = this.platform.omniService.omni.thermostats[this.platformAccessory.context.index].status;
    if (thermostatStatus === undefined) {
      return;
    }

    if (thermostatStatus.mode === ThermostatModes.Cool) {
      await this.platform.omniService.setThermostatCoolSetPoint(this.platformAccessory.context.index, value as number);
      return;
    }
    await this.platform.omniService.setThermostatHeatSetPoint(this.platformAccessory.context.index, value as number);
  }

  private getTemperatureDisplayUnits(): CharacteristicValue {
    this.platform.log.debug(this.constructor.name, 'getTemperatureDisplayUnits');

    return this.platform.omniService.omni.formats.temperature === TemperatureFormats.Fahrenheit
      ? this.platform.Characteristic.TemperatureDisplayUnits.FAHRENHEIT
      : this.platform.Characteristic.TemperatureDisplayUnits.CELSIUS;
  }

  private getCoolingThresholdTemperature(): CharacteristicValue {
    this.platform.log.debug(this.constructor.name, 'getCoolingThresholdTemperature');

    const thermostatStatus = this.platform.omniService.omni.thermostats[this.platformAccessory.context.index].status;
    if (thermostatStatus === undefined) {
      return this.maxTemperature;
    }

    return Math.min(thermostatStatus.coolSetPoint.toCelcius(), this.maxTemperature);
  }

  private async setCoolingThresholdTemperature(value: CharacteristicValue): Promise<void> {
    this.platform.log.debug(this.constructor.name, 'setCoolingThresholdTemperature', value);

    await this.platform.omniService.setThermostatCoolSetPoint(this.platformAccessory.context.index, value as number);
  }

  private getHeatingThresholdTemperature(): CharacteristicValue {
    this.platform.log.debug(this.constructor.name, 'getHeatingThresholdTemperature');

    const thermostatStatus = this.platform.omniService.omni.thermostats[this.platformAccessory.context.index].status;
    if (thermostatStatus === undefined) {
      return this.minTemperature;
    }

    return Math.max(thermostatStatus.heatSetPoint.toCelcius(), this.minTemperature);
  }

  private async setHeatingThresholdTemperature(value: CharacteristicValue): Promise<void> {
    this.platform.log.debug(this.constructor.name, 'setHeatingThresholdTemperature', value);

    await this.platform.omniService.setThermostatHeatSetPoint(this.platformAccessory.context.index, value as number);
  }

  private getCurrentRelativeHumidity(): CharacteristicValue {
    this.platform.log.debug(this.constructor.name, 'getCurrentRelativeHumidity');

    const thermostatStatus = this.platform.omniService.omni.thermostats[this.platformAccessory.context.index].status;
    if (thermostatStatus === undefined) {
      return 0;
    }

    return thermostatStatus.humidity.toPercentage();
  }

  private getTargetRelativeHumidity(): CharacteristicValue {
    this.platform.log.debug(this.constructor.name, 'getTargetRelativeHumidity');

    const thermostatStatus = this.platform.omniService.omni.thermostats[this.platformAccessory.context.index].status;
    if (thermostatStatus === undefined) {
      return 0;
    }

    return this.platform.settings.targetHumiditySetPointType === 1
      ? thermostatStatus.humidifySetPoint.toPercentage()
      : thermostatStatus.dehumidifySetPoint.toPercentage();
  }

  private async setTargetRelativeHumidity(value: CharacteristicValue): Promise<void> {
    this.platform.log.debug(this.constructor.name, 'setTargetRelativeHumidity', value);

    const thermostatStatus = this.platform.omniService.omni.thermostats[this.platformAccessory.context.index].status;
    if (thermostatStatus === undefined) {
      return;
    }

    const humidity = value as number;
    let humidifySetPoint: number | undefined;
    let dehumidifySetPoint: number | undefined;
    if (this.platform.settings.targetHumiditySetPointType === 1) {
      humidifySetPoint = humidity;
      if (this.platform.settings.targetHumidityDifference !== 0) {
        dehumidifySetPoint = humidity + this.platform.settings.targetHumidityDifference;
      }
    } else {
      dehumidifySetPoint = humidity;
      if (this.platform.settings.targetHumidityDifference !== 0) {
        humidifySetPoint = humidity - this.platform.settings.targetHumidityDifference;
      }
    }

    if (humidifySetPoint !== undefined) {
      await this.platform.omniService.setThermostatHumidifySetPoint(this.platformAccessory.context.index, humidifySetPoint);
    }
    if (dehumidifySetPoint !== undefined) {
      await this.platform.omniService.setThermostatDehumidifySetPoint(this.platformAccessory.context.index, dehumidifySetPoint);
    }
  }

  updateValues(thermostatStatus: ThermostatStatus): void {
    this.platform.log.debug(this.constructor.name, 'updateValues', thermostatStatus);

    this.service
      .getCharacteristic(this.platform.Characteristic.CurrentHeatingCoolingState)
      .updateValue(this.getCurrentHeatingCoolingStateCharacteristicValue(thermostatStatus));

    this.service
      .getCharacteristic(this.platform.Characteristic.TargetHeatingCoolingState)
      .updateValue(this.getTargetHeatingCoolingStateCharacteristicValue(thermostatStatus));

    this.service
      .getCharacteristic(this.platform.Characteristic.CurrentTemperature)
      .updateValue(this.getCurrentTemperatureCharacteristicValue(thermostatStatus));

    this.service
      .getCharacteristic(this.platform.Characteristic.TargetTemperature)
      .updateValue(this.getTargetTemperatureCharacteristicValue(thermostatStatus));

    this.service
      .getCharacteristic(this.platform.Characteristic.CoolingThresholdTemperature)
      .updateValue(thermostatStatus.coolSetPoint.toCelcius());

    this.service
      .getCharacteristic(this.platform.Characteristic.HeatingThresholdTemperature)
      .updateValue(thermostatStatus.heatSetPoint.toCelcius());

    if (this.platform.settings.includeHumidityControls) {
      this.service
        .getCharacteristic(this.platform.Characteristic.CurrentRelativeHumidity)
        .updateValue(thermostatStatus.humidity.toPercentage());

      this.service
        .getCharacteristic(this.platform.Characteristic.TargetRelativeHumidity)
        .updateValue(this.platform.settings.targetHumiditySetPointType === 1
          ? thermostatStatus.humidifySetPoint.toPercentage()
          : thermostatStatus.dehumidifySetPoint.toPercentage());
    }
  }
}