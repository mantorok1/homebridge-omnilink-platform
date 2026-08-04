import type { MatterRequests } from 'homebridge'

import type { ThermostatStatus } from '../../models/Thermostat.js'
import type { OmniLinkPlatform } from '../../platform.js'

import { OmniObjectStatusTypes } from '../../models/OmniObjectBase.js'
import { HoldStates, ThermostatModes, ThermostatTypes } from '../../models/Thermostat.js'
import { MatterAccessoryBase } from './MatterAccessoryBase.js'

interface SystemModeChangeRequest {
  systemMode: number
  oldSystemMode: number
}

interface OccupiedHeatingSetpointChangeRequest {
  occupiedHeatingSetpoint: number
  oldOccupiedHeatingSetpoint: number
}

interface OccupiedCoolingSetpointChangeRequest {
  occupiedCoolingSetpoint: number
  oldOccupiedCoolingSetpoint: number
}

export class Thermostat extends MatterAccessoryBase {
  private readonly heaterTypes = [ThermostatTypes.AutoHeatCool, ThermostatTypes.HeatCool, ThermostatTypes.Heat]
  private readonly coolerTypes = [ThermostatTypes.AutoHeatCool, ThermostatTypes.HeatCool, ThermostatTypes.Cool]

  constructor(
    platform: OmniLinkPlatform,
    displayName: string,
    key: string,
    index?: number,
  ) {
    platform.log.debug('Thermostat', 'constructor', displayName, key, index)

    const status = platform.omniService.omni.thermostats[index!].status
    const type = platform.omniService.omni.thermostats[index!].type

    const minSetpoint = Math.round(platform.settings.minTemperature * 100)
    const maxSetpoint = Math.round(platform.settings.maxTemperature * 100)
    const occupiedHeatingSetpoint = Thermostat.getHeatingSetpoint(status, minSetpoint, maxSetpoint)
    const occupiedCoolingSetpoint = Thermostat.getCoolingSetpoint(status, minSetpoint, maxSetpoint)

    super(platform, {
      UUID: platform.api.matter!.uuid.generate(key),
      displayName,
      deviceType: platform.api.matter!.deviceTypes.Thermostat,

      context: {
        type: Thermostat.type.toLowerCase(),
        index,
        key,
      },

      clusters: {
        thermostat: {
          externalMeasuredIndoorTemperature: Thermostat.getCurrentTemperature(status, minSetpoint, maxSetpoint),
          occupiedHeatingSetpoint,
          occupiedCoolingSetpoint,
          minHeatSetpointLimit: minSetpoint,
          maxHeatSetpointLimit: maxSetpoint,
          minCoolSetpointLimit: minSetpoint,
          maxCoolSetpointLimit: maxSetpoint,
          minSetpointDeadBand: 25,
          controlSequenceOfOperation: Thermostat.getControlSequenceOfOperation(type),
          systemMode: Thermostat.getSystemMode(status),
          externallyMeasuredOccupancy: true,
        },
      },

      handlers: {
        thermostat: {
          setpointRaiseLower: async request => this.setpointRaiseLower(request),
          systemModeChange: async request => this.setSystemMode(request),
          occupiedHeatingSetpointChange: async request => this.setOccupiedHeatingSetpoint(request),
          occupiedCoolingSetpointChange: async request => this.setOccupiedCoolingSetpoint(request),
        },
      },
    })

    this.setEventHandlers()
  }

  static type = 'Thermostat'

  setEventHandlers(): void {
    this.platform.log.debug(this.constructor.name, 'setEventHandlers')

    const index = this.context.index as number
    const eventKey = this.platform.omniService.getEventKey(OmniObjectStatusTypes.Thermostat, index)

    this.platform.omniService.on(eventKey, this.updateValues.bind(this))
  }

  async updateValues(status: ThermostatStatus): Promise<void> {
    this.platform.log.debug(this.constructor.name, 'updateValues', status)

    const minSetpoint = Math.round(this.platform.settings.minTemperature * 100)
    const maxSetpoint = Math.round(this.platform.settings.maxTemperature * 100)

    await this.updateState(this.platform.api.matter!.clusterNames.Thermostat, {
      externalMeasuredIndoorTemperature: Thermostat.getCurrentTemperature(status, minSetpoint, maxSetpoint),
      occupiedHeatingSetpoint: Thermostat.getHeatingSetpoint(status, minSetpoint, maxSetpoint),
      occupiedCoolingSetpoint: Thermostat.getCoolingSetpoint(status, minSetpoint, maxSetpoint),
      systemMode: Thermostat.getSystemMode(status),
    })
  }

  async setSystemMode(request: SystemModeChangeRequest): Promise<void> {
    this.platform.log.debug(this.constructor.name, 'setSystemMode', request)

    const index = this.context.index as number
    const thermostatType = this.platform.omniService.omni.thermostats[index].type
    const requestedMode = Thermostat.getOmniMode(request.systemMode)

    if (!this.isModeSupported(requestedMode, thermostatType)) {
      return
    }

    await this.platform.omniService.setThermostatMode(index, requestedMode)
  }

  async setOccupiedHeatingSetpoint(request: OccupiedHeatingSetpointChangeRequest): Promise<void> {
    this.platform.log.debug(this.constructor.name, 'setOccupiedHeatingSetpoint', request)

    const index = this.context.index as number
    await this.platform.omniService.setThermostatHeatSetPoint(index, request.occupiedHeatingSetpoint / 100)
  }

  async setOccupiedCoolingSetpoint(request: OccupiedCoolingSetpointChangeRequest): Promise<void> {
    this.platform.log.debug(this.constructor.name, 'setOccupiedCoolingSetpoint', request)

    const index = this.context.index as number
    await this.platform.omniService.setThermostatCoolSetPoint(index, request.occupiedCoolingSetpoint / 100)
  }

  async setpointRaiseLower(request: MatterRequests.SetpointRaiseLower): Promise<void> {
    this.platform.log.debug(this.constructor.name, 'setpointRaiseLower', request)

    const index = this.context.index as number
    const thermostatStatus = this.platform.omniService.omni.thermostats[index].status
    if (thermostatStatus === undefined) {
      return
    }

    const delta = request.amount / 10
    const heatSetpoint = thermostatStatus.heatSetPoint.toCelcius() + delta
    const coolSetpoint = thermostatStatus.coolSetPoint.toCelcius() + delta

    switch (request.mode) {
      case 0: // heat
        await this.setTemperatureWithHoldProtection(index, true, heatSetpoint)
        break
      case 1: // cool
        await this.setTemperatureWithHoldProtection(index, false, coolSetpoint)
        break
      case 2: // both
        await this.setTemperatureWithHoldProtection(index, true, heatSetpoint)
        await this.setTemperatureWithHoldProtection(index, false, coolSetpoint)
        break
      default:
        break
    }
  }

  private async setTemperatureWithHoldProtection(index: number, heat: boolean, temperature: number): Promise<void> {
    const thermostatStatus = this.platform.omniService.omni.thermostats[index].status
    const currentHoldState = thermostatStatus.hold

    if (currentHoldState !== HoldStates.Off) {
      await this.platform.omniService.setThermostatHoldState(index, HoldStates.Off)
    }

    if (heat) {
      await this.platform.omniService.setThermostatHeatSetPoint(index, temperature)
    } else {
      await this.platform.omniService.setThermostatCoolSetPoint(index, temperature)
    }

    if (currentHoldState !== HoldStates.Off) {
      await this.platform.omniService.setThermostatHoldState(index, currentHoldState)
    }
  }

  private isModeSupported(mode: ThermostatModes, thermostatType: ThermostatTypes): boolean {
    if (mode === ThermostatModes.Off) {
      return true
    }
    if (mode === ThermostatModes.Auto) {
      return thermostatType === ThermostatTypes.AutoHeatCool
    }
    if (mode === ThermostatModes.Heat || mode === ThermostatModes.EmergencyHeat) {
      return this.heaterTypes.includes(thermostatType)
    }
    if (mode === ThermostatModes.Cool) {
      return this.coolerTypes.includes(thermostatType)
    }
    return false
  }

  static getCurrentTemperature(status: ThermostatStatus, minSetpoint: number, maxSetpoint: number): number {
    const currentTemperature = Math.round(status.temperature.toCelcius() * 100)
    return Math.max(minSetpoint, Math.min(maxSetpoint, currentTemperature))
  }

  static getHeatingSetpoint(status: ThermostatStatus, minSetpoint: number, maxSetpoint: number): number {
    const value = Math.round(status.heatSetPoint.toCelcius() * 100)
    return Math.max(minSetpoint, Math.min(maxSetpoint, value))
  }

  static getCoolingSetpoint(status: ThermostatStatus, minSetpoint: number, maxSetpoint: number): number {
    const value = Math.round(status.coolSetPoint.toCelcius() * 100)
    return Math.max(minSetpoint, Math.min(maxSetpoint, value))
  }

  static getSystemMode(status: ThermostatStatus): number {
    switch (status.mode) {
      case ThermostatModes.Auto:
        return 1
      case ThermostatModes.Cool:
        return 3
      case ThermostatModes.Heat:
      case ThermostatModes.EmergencyHeat:
        return 4
      default:
        return 0
    }
  }

  static getOmniMode(systemMode: number): ThermostatModes {
    switch (systemMode) {
      case 1:
        return ThermostatModes.Auto
      case 3:
        return ThermostatModes.Cool
      case 4:
      case 5:
        return ThermostatModes.Heat
      default:
        return ThermostatModes.Off
    }
  }

  static getControlSequenceOfOperation(type: ThermostatTypes): number {
    switch (type) {
      case ThermostatTypes.Heat:
        return 2
      case ThermostatTypes.Cool:
        return 0
      case ThermostatTypes.AutoHeatCool:
      case ThermostatTypes.HeatCool:
      case ThermostatTypes.SetPoint:
      default:
        return 4
    }
  }
}
