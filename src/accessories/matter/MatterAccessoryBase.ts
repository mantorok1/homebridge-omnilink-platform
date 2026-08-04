import type { API, ClusterStateMap, EndpointType, Logger, MatterAccessory, MatterAPI } from 'homebridge'

import type { OmniLinkPlatform } from '../../platform.js'

import crypto from 'node:crypto'

export interface BaseMatterAccessoryConfig {
  UUID: string
  displayName: string
  deviceType: EndpointType
  context?: Record<string, unknown>
  clusters?: MatterAccessory['clusters']
  handlers?: MatterAccessory['handlers']
  parts?: MatterAccessory['parts']
}

export abstract class MatterAccessoryBase implements MatterAccessory {
  public readonly UUID: string
  public readonly displayName: string
  public readonly deviceType: EndpointType
  public readonly serialNumber: string
  public readonly manufacturer: string
  public readonly model: string
  public readonly firmwareRevision: string
  public readonly hardwareRevision: string
  public readonly context: Record<string, unknown>
  public readonly clusters?: MatterAccessory['clusters']
  public readonly handlers?: MatterAccessory['handlers']
  public readonly parts?: MatterAccessory['parts']

  constructor(
    protected readonly platform: OmniLinkPlatform,
    config: BaseMatterAccessoryConfig,
  ) {
    this.UUID = config.UUID
    this.displayName = config.displayName
    this.deviceType = config.deviceType
    this.serialNumber = crypto.createHash('md5').update(config.UUID).digest('hex')
    this.manufacturer = 'Leviton'
    this.model = platform.omniService.omni.information.model
    this.firmwareRevision = platform.omniService.omni.information.version
    this.hardwareRevision = platform.omniService.omni.information.version
    this.clusters = config.clusters
    this.handlers = config.handlers
    this.parts = config.parts
    this.context = config.context ?? {}
  }

  protected async updateState<K extends keyof ClusterStateMap>(cluster: K, attributes: Partial<ClusterStateMap[K]>, partId?: string): Promise<void>
  protected async updateState(cluster: string, attributes: Record<string, unknown>, partId?: string): Promise<void>
  protected async updateState(cluster: string, attributes: Record<string, unknown>, partId?: string): Promise<void> {
    await this.platform.api.matter!.updateAccessoryState(this.UUID, cluster, attributes, partId)
    this.platform.log.debug(`[${this.displayName}] Updated ${cluster} state:`, attributes)
  }

  protected async readState<K extends keyof ClusterStateMap>(cluster: K, partId?: string): Promise<Partial<ClusterStateMap[K]> | undefined>
  protected async readState(cluster: string, partId?: string): Promise<Record<string, unknown> | undefined>
  protected async readState(cluster: string, partId?: string): Promise<Record<string, unknown> | undefined> {
    return await this.platform.api.matter!.getAccessoryState(this.UUID, cluster, partId)
  }
}
