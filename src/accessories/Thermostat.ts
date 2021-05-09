import { PlatformAccessory } from 'homebridge';
import { OmniLinkPlatform } from '../platform';
import { AccessoryBase } from './AccessoryBase';
import { ThermostatTypes } from '../omni/messages/ThermostatPropertiesResponse';
import { TemperatureFormats } from '../omni/messages/SystemFormatsResponse';
import { ThermostatStatus, ThermostatStates, ThermostatModes } from '../models/ThermostatStatus';

export class Thermostat extends AccessoryBase {
  private heaterTypes = [ThermostatTypes.AutoHeatCool, ThermostatTypes.HeatCool, ThermostatTypes.Heat];
  private coolerTypes = [ThermostatTypes.AutoHeatCool, ThermostatTypes.HeatCool, ThermostatTypes.Cool];

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

    const thermostatType = this.platform.omniService.thermostats.get(this.platformAccessory.context.index)!.thermostatType;
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

    const thermostatType = this.platform.omniService.thermostats.get(this.platformAccessory.context.index)!.thermostatType;
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
      .on('get', this.getCharacteristicValue.bind(this, this.getCurrentHeatingCoolingState.bind(this), 'CurrentHeatingCoolingState'));

    this.service
      .getCharacteristic(this.platform.Characteristic.TargetHeatingCoolingState)
      .on('get', this.getCharacteristicValue.bind(this, this.getTargetHeatingCoolingState.bind(this), 'TargetHeatingCoolingState'))
      .on('set', this.setCharacteristicValue.bind(this, this.setTargetHeatingCoolingState.bind(this), 'TargetHeatingCoolingState'));

    this.service
      .getCharacteristic(this.platform.Characteristic.CurrentTemperature)
      .on('get', this.getCharacteristicValue.bind(this, this.getCurrentTemperature.bind(this), 'CurrentTemperature'));

    this.service
      .getCharacteristic(this.platform.Characteristic.TargetTemperature)
      .on('get', this.getCharacteristicValue.bind(this, this.getTargetTemperature.bind(this), 'TargetTemperature'))
      .on('set', this.setCharacteristicValue.bind(this, this.setTargetTemperature.bind(this), 'TargetTemperature'));

    this.service
      .getCharacteristic(this.platform.Characteristic.TemperatureDisplayUnits)
      .on('get', this.getCharacteristicValue.bind(this, this.getTemperatureDisplayUnits.bind(this), 'TemperatureDisplayUnits'));

    this.service
      .getCharacteristic(this.platform.Characteristic.CoolingThresholdTemperature)
      .on('get', this.getCharacteristicValue.bind(this, this.getCoolingThresholdTemperature.bind(this), 'CoolingThresholdTemperature'))
      .on('set', this.setCharacteristicValue.bind(this, this.setCoolingThresholdTemperature.bind(this), 'CoolingThresholdTemperature'));

    this.service
      .getCharacteristic(this.platform.Characteristic.HeatingThresholdTemperature)
      .on('get', this.getCharacteristicValue.bind(this, this.getHeatingThresholdTemperature.bind(this), 'HeatingThresholdTemperature'))
      .on('set', this.setCharacteristicValue.bind(this, this.setHeatingThresholdTemperature.bind(this), 'HeatingThresholdTemperature'));

    if (this.platform.settings.includeHumidityControls) {
      this.service
        .getCharacteristic(this.platform.Characteristic.CurrentRelativeHumidity)
        .on('get', this.getCharacteristicValue.bind(this, this.getCurrentRelativeHumidity.bind(this), 'CurrentRelativeHumidity'));

      this.service
        .getCharacteristic(this.platform.Characteristic.TargetRelativeHumidity)
        .on('get', this.getCharacteristicValue.bind(this, this.getTargetRelativeHumidity.bind(this), 'TargetRelativeHumidity'))
        .on('set', this.setCharacteristicValue.bind(this, this.setTargetRelativeHumidity.bind(this), 'TargetRelativeHumidity'));
    }

    this.platform.omniService.on(`thermostat-${this.platformAccessory.context.index}`, this.updateValues.bind(this));
  }

  async getCurrentHeatingCoolingState(): Promise<number> {
    this.platform.log.debug(this.constructor.name, 'getCurrentHeatingCoolingState');

    const thermostatStatus = await this.platform.omniService.getThermostatStatus(this.platformAccessory.context.index);
    if (thermostatStatus === undefined) {
      return this.platform.Characteristic.CurrentHeatingCoolingState.OFF;
    }

    return this.getCurrentHeatingCoolingStateCharacteristicValue(thermostatStatus);
  }

  private getCurrentHeatingCoolingStateCharacteristicValue(status: ThermostatStatus): number {
    switch (status.state) {
      case ThermostatStates.Heating:
        return this.platform.Characteristic.CurrentHeatingCoolingState.HEAT;
      case ThermostatStates.Cooling:
        return this.platform.Characteristic.CurrentHeatingCoolingState.COOL;
      default:
        return this.platform.Characteristic.CurrentHeatingCoolingState.OFF;
    }
  }

  async getTargetHeatingCoolingState(): Promise<number> {
    this.platform.log.debug(this.constructor.name, 'getTargetHeatingCoolingState');

    const thermostatStatus = await this.platform.omniService.getThermostatStatus(this.platformAccessory.context.index);
    if (thermostatStatus === undefined) {
      return this.platform.Characteristic.TargetHeatingCoolingState.OFF;
    }

    return this.getTargetHeatingCoolingStateCharacteristicValue(thermostatStatus);
  }

  getTargetHeatingCoolingStateCharacteristicValue(status: ThermostatStatus): number {
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

  async setTargetHeatingCoolingState(value: number): Promise<void> {
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

  async getCurrentTemperature(): Promise<number> {
    this.platform.log.debug(this.constructor.name, 'getCurrentTemperature');

    const thermostatStatus = await this.platform.omniService.getThermostatStatus(this.platformAccessory.context.index);
    if (thermostatStatus === undefined) {
      return 0;
    }

    return thermostatStatus.currentTemperature;
  }

  async getTargetTemperature(): Promise<number> {
    this.platform.log.debug(this.constructor.name, 'getTargetTemperature');

    const thermostatStatus = await this.platform.omniService.getThermostatStatus(this.platformAccessory.context.index);
    if (thermostatStatus === undefined) {
      return 0;
    }

    return this.getTargetTemperatureCharacteristicValue(thermostatStatus);
  }

  getTargetTemperatureCharacteristicValue(thermostatStatus: ThermostatStatus): number {
    return thermostatStatus.mode === ThermostatModes.Cool
      ? thermostatStatus.coolSetPoint
      : thermostatStatus.heatSetPoint;
  }

  async setTargetTemperature(value: number): Promise<void> {
    this.platform.log.debug(this.constructor.name, 'setTargetTemperature', value);

    const thermostatStatus = await this.platform.omniService.getThermostatStatus(this.platformAccessory.context.index);
    if (thermostatStatus === undefined) {
      return;
    }

    if (thermostatStatus.mode === ThermostatModes.Cool) {
      await this.platform.omniService.setThermostatCoolSetPoint(this.platformAccessory.context.index, value);
      return;
    }
    await this.platform.omniService.setThermostatHeatSetPoint(this.platformAccessory.context.index, value);
  }

  async getTemperatureDisplayUnits(): Promise<number> {
    this.platform.log.debug(this.constructor.name, 'getTemperatureDisplayUnits');

    return this.platform.omniService.temperatureFormat === TemperatureFormats.Fahrenheit
      ? this.platform.Characteristic.TemperatureDisplayUnits.FAHRENHEIT
      : this.platform.Characteristic.TemperatureDisplayUnits.CELSIUS;
  }

  async getCoolingThresholdTemperature(): Promise<number> {
    this.platform.log.debug(this.constructor.name, 'getCoolingThresholdTemperature');

    const thermostatStatus = await this.platform.omniService.getThermostatStatus(this.platformAccessory.context.index);
    if (thermostatStatus === undefined) {
      return 0;
    }

    return thermostatStatus.coolSetPoint;
  }

  async setCoolingThresholdTemperature(value: number): Promise<void> {
    this.platform.log.debug(this.constructor.name, 'setCoolingThresholdTemperature', value);

    await this.platform.omniService.setThermostatCoolSetPoint(this.platformAccessory.context.index, value);
  }

  async getHeatingThresholdTemperature(): Promise<number> {
    this.platform.log.debug(this.constructor.name, 'getHeatingThresholdTemperature');

    const thermostatStatus = await this.platform.omniService.getThermostatStatus(this.platformAccessory.context.index);
    if (thermostatStatus === undefined) {
      return 0;
    }

    return thermostatStatus.heatSetPoint;
  }

  async setHeatingThresholdTemperature(value: number): Promise<void> {
    this.platform.log.debug(this.constructor.name, 'setHeatingThresholdTemperature', value);

    await this.platform.omniService.setThermostatHeatSetPoint(this.platformAccessory.context.index, value);
  }

  async getCurrentRelativeHumidity(): Promise<number> {
    this.platform.log.debug(this.constructor.name, 'getCurrentRelativeHumidity');

    const thermostatStatus = await this.platform.omniService.getThermostatStatus(this.platformAccessory.context.index);
    if (thermostatStatus === undefined) {
      return 0;
    }

    return thermostatStatus.currentHumidity;
  }

  async getTargetRelativeHumidity(): Promise<number> {
    this.platform.log.debug(this.constructor.name, 'getTargetRelativeHumidity');

    const thermostatStatus = await this.platform.omniService.getThermostatStatus(this.platformAccessory.context.index);
    if (thermostatStatus === undefined) {
      return 0;
    }

    return this.platform.settings.targetHumiditySetPointType === 1
      ? thermostatStatus.humidifySetPoint
      : thermostatStatus.dehumidifySetPoint;
  }

  async setTargetRelativeHumidity(value: number): Promise<void> {
    this.platform.log.debug(this.constructor.name, 'setTargetRelativeHumidity', value);

    const thermostatStatus = await this.platform.omniService.getThermostatStatus(this.platformAccessory.context.index);
    if (thermostatStatus === undefined) {
      return;
    }

    let humidifySetPoint: number | undefined;
    let dehumidifySetPoint: number | undefined;
    if (this.platform.settings.targetHumiditySetPointType === 1) {
      humidifySetPoint = value;
      if (this.platform.settings.targetHumidityDifference !== 0) {
        dehumidifySetPoint = value + this.platform.settings.targetHumidityDifference;
      }
    } else {
      dehumidifySetPoint = value;
      if (this.platform.settings.targetHumidityDifference !== 0) {
        humidifySetPoint = value - this.platform.settings.targetHumidityDifference;
      }
    }

    if (humidifySetPoint !== undefined) {
      await this.platform.omniService.setThermostatHumidifySetPoint(this.platformAccessory.context.index, humidifySetPoint);
    }
    if (dehumidifySetPoint !== undefined) {
      await this.platform.omniService.setThermostatDehumidifySetPoint(this.platformAccessory.context.index, dehumidifySetPoint);
    }
  }

  async updateValues(thermostatStatus: ThermostatStatus): Promise<void> {
    this.platform.log.debug(this.constructor.name, 'updateValues', thermostatStatus);

    this.service
      .getCharacteristic(this.platform.Characteristic.CurrentHeatingCoolingState)
      .updateValue(this.getCurrentHeatingCoolingStateCharacteristicValue(thermostatStatus));

    this.service
      .getCharacteristic(this.platform.Characteristic.TargetHeatingCoolingState)
      .updateValue(this.getTargetHeatingCoolingStateCharacteristicValue(thermostatStatus));

    this.service
      .getCharacteristic(this.platform.Characteristic.CurrentTemperature)
      .updateValue(thermostatStatus.currentTemperature);

    this.service
      .getCharacteristic(this.platform.Characteristic.TargetTemperature)
      .updateValue(this.getTargetTemperatureCharacteristicValue(thermostatStatus));

    this.service
      .getCharacteristic(this.platform.Characteristic.CoolingThresholdTemperature)
      .updateValue(thermostatStatus.coolSetPoint);

    this.service
      .getCharacteristic(this.platform.Characteristic.HeatingThresholdTemperature)
      .updateValue(thermostatStatus.heatSetPoint);

    if (this.platform.settings.includeHumidityControls) {
      this.service
        .getCharacteristic(this.platform.Characteristic.CurrentRelativeHumidity)
        .updateValue(thermostatStatus.currentHumidity);

      this.service
        .getCharacteristic(this.platform.Characteristic.TargetRelativeHumidity)
        .updateValue(this.platform.settings.targetHumiditySetPointType === 1
          ? thermostatStatus.humidifySetPoint
          : thermostatStatus.dehumidifySetPoint);
    }
  }
}