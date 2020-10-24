import net = require('net');
import events = require('events');
import cq = require('concurrent-queue');
import NodeCache = require('node-cache');

import { OmniLinkPlatform } from '../platform';
import { PacketTypes, OmniPacket, OmniPacketRequest, OmniPacketResponse } from './OmniPacket';
import { MessageTypes, ObjectTypes } from './messages/enums';
import { AcknowledgeResponse } from './messages/AcknowledgeResponse';
import { SessionResponse } from './messages/SessionResponse';
import { SecureConnectionRequest } from './messages/SecureConnectionRequest';
import { SecureConnectionResponse } from './messages/SecureConnectionResponse';
import { ApplicationDataRequest } from './messages/ApplicationDataRequest';
import { ApplicationDataResponse } from './messages/ApplicationDataResponse';
import { SystemInformationResponse } from './messages/SystemInformationResponse';
import { SystemStatusResponse } from './messages/SystemStatusResponse';
import { ObjectTypeCapacitiesResponse } from './messages/ObjectTypeCapacitiesResponse';
import { ZonePropertiesResponse } from './messages/ZonePropertiesResponse';
import { AreaPropertiesResponse } from './messages/AreaPropertiesResponse';
import { ButtonPropertiesResponse } from './messages/ButtonPropertiesResponse';
import { CodePropertiesResponse } from './messages/CodePropertiesResponse';
import { ExtendedAreaStatusResponse } from './messages/ExtendedAreaStatusResponse';
import { ExtendedZoneStatusResponse } from './messages/ExtendedZoneStatusResponse';
import { SecurityCodeValidationResponse } from './messages/SecurityCodeValidationResponse';

export class OmniSession extends events.EventEmitter {
  private socket: net.Socket;
  private sequence: number;
  private sessionId?: Buffer;
  private sessionKey?: Buffer;
  private queue?: cq;
  private cache: NodeCache;

  constructor(private readonly platform: OmniLinkPlatform) {
    super();

    this.socket = new net.Socket();
    this.sequence = 0;
    this.cache = new NodeCache({ stdTTL: 1 });

    // Special Event handler for Notifications
    this.on('0', this.notificationHandler.bind(this));
  }

  openConnection(): Promise<void> {
    this.platform.log.debug(this.constructor.name, 'openConnection');

    return new Promise((resolve, reject) => {

      this.socket = new net.Socket();
    
      this.socket.once('error', (error) => {
        this.platform.log.info('TCP Connection: Error');
        this.socket.setTimeout(0);
        this.socket.removeAllListeners();
        reject(error);
      });

      this.socket.once('timeout', () => {
        this.platform.log.info('TCP Connection: Timeout');
        this.socket.setTimeout(0);
        this.socket.removeAllListeners();
        reject(new Error('TCP Connection timed out'));
      });

      this.socket.once('ready', async () => {
        this.platform.log.info('TCP Connection: Open');
        this.socket.setTimeout(0);
        this.socket.removeAllListeners();
        resolve();
      });
      
      this.socket.setTimeout(10000);
      this.socket.connect(this.platform.settings.port, this.platform.settings.address);
    });
  }

  closeConnection(): void {
    this.platform.log.debug(this.constructor.name, 'closeConnection');

    try {
      this.socket.removeAllListeners();
      this.socket.destroy();
    } finally {
      this.platform.log.info('TCP Connection: Closed');
    }
  }

  async startSession(): Promise<void> {
    this.platform.log.debug(this.constructor.name, 'startSession');

    try {
      this.socket.on('error', (error) => {
        this.emit('tcp-error', error);
      });
      
      this.socket.on('data', this.receivePacket.bind(this));

      await this.startNewSession();
      await this.openSecureConnection();

      this.queue = cq()
        .limit({ concurrency: 1 })
        .process(this.sendPacket.bind(this));

    } catch (error) {
      this.platform.log.error(error);
      throw error;
    }
  }

  async stopSession(): Promise<void> {
    this.platform.log.debug(this.constructor.name, 'stopSession');

    try {
      await this.stopNewSession();
    } catch (error) {
      this.platform.log.error(error);
    }
  }

  private getNextSequence(): number {
    this.sequence++;
    if (this.sequence> 65535) {
      this.sequence = 1;
    }
    return this.sequence;
  }

  private async startNewSession(): Promise<void> {
    this.platform.log.debug(this.constructor.name, 'startNewSession');

    const sequence = this.getNextSequence();
    const packetRequest = new OmniPacketRequest({
      sequence: sequence,
      type: PacketTypes.NewSessionRequest,
    });

    this.platform.log.debug(`[${sequence}] New Session Request: Sent`);
    const packetResponse = await this.sendPacket(packetRequest);

    const message = this.processPacket(packetResponse);

    if (message instanceof SessionResponse) {
      const session = message as SessionResponse;
      this.platform.log.debug(`[${sequence}] New Session Request: Complete (${session.sessionId?.toString('hex')})`);
      this.processSessionId(session.sessionId!);
      return;
    }

    this.platform.log.debug(`[${sequence}] New Session Request: Failed`);
    throw new Error('New Session failed');
  }

  private processSessionId(sessionId: Buffer) {
    this.sessionId = sessionId;
    this.sessionKey = Buffer.from(this.platform.settings.privateKey);
    for(let i = 0; i < this.sessionId!.length; i++) {
      this.sessionKey[11 + i] ^= this.sessionId![i]; 
    }
  }

  private async stopNewSession(): Promise<void> {
    this.platform.log.debug(this.constructor.name, 'stopNewSession');

    const sequence = this.getNextSequence();
    const packetRequest = new OmniPacketRequest({
      sequence: sequence,
      type: PacketTypes.ClientSessionTerminated,
    });

    this.platform.log.debug(`[${sequence}] Session Terminate Request: Sent`);
    await this.sendPacket(packetRequest);

    this.platform.log.debug(`[${sequence}] Session Terminate Request: Complete`);
  }

  private async openSecureConnection(): Promise<void> {
    this.platform.log.debug(this.constructor.name, 'openSecureConnection');

    const sequence = this.getNextSequence();
    const packetRequest = new OmniPacketRequest({
      sequence: sequence,
      type: PacketTypes.SecureConnectionRequest,
      message: new SecureConnectionRequest(this.sessionId!),
      sessionKey: this.sessionKey,
    });

    this.platform.log.debug(`[${sequence}] Secure Connection Request: Sent`);
    const packetResponse = await this.sendPacket(packetRequest);

    const message = this.processPacket(packetResponse);

    if (message instanceof SecureConnectionResponse) {
      this.platform.log.debug(`[${sequence}] Secure Connection Request: Complete`);
      return;
    }

    this.platform.log.warn('Unable to create a secure connection to controller. Private key may be incorrect');
    throw new Error('Secure Connection failed');
  }

  async sendApplicationDataMessage(message: ApplicationDataRequest): Promise<ApplicationDataResponse> {
    this.platform.log.debug(this.constructor.name, 'sendApplicationDataMessage', message.serialize());

    const sequence = this.getNextSequence();
    const packetRequest = new OmniPacketRequest({
      sequence: sequence,
      type: PacketTypes.ApplicationData,
      message: message,
      sessionKey: this.sessionKey,
    });

    this.platform.log.debug(`[${sequence}] Application Data Request: Sent`);
    const packetResponse = await this.queue(packetRequest);

    const response = this.processPacket(packetResponse);

    if (response instanceof ApplicationDataResponse) {
      this.platform.log.debug(`[${sequence}] Application Data Request: Complete`);
      return response;
    }

    this.platform.log.debug(`[${sequence}] Application Data Request: Failed`);
    throw new Error('Application Data failed');
  }
  
  private sendPacket(packet: OmniPacket): Promise<OmniPacket>{
    this.platform.log.debug(this.constructor.name, 'sendPacket', packet.serialise());

    return new Promise((resolve) => {
      const key = packet.type === PacketTypes.ApplicationData ? packet.message!.toString('hex') : '';
      if (key.length > 0) {
        const value: OmniPacket | undefined = this.cache.get(key);
        if (value !== undefined) {
          resolve(value);
          return;
        }
      }

      this.once(packet.sequence.toString(), (response: OmniPacket) => {
        if (key.length > 0) {
          this.cache.set(key, response);
        }
        resolve(response);
      });

      this.socket.write(packet.serialise());
    });
  }
  
  /*
  private sendPacket(packet: OmniPacket): Promise<OmniPacket>{
    this.platform.log.debug(this.constructor.name, 'sendPacket', packet.serialise());

    return new Promise((resolve) => {
      this.once(packet.sequence.toString(), (response: OmniPacket) => {
        resolve(response);
      });

      this.socket.write(packet.serialise());
    });
  }
  */

  private receivePacket(response: Buffer) {
    this.platform.log.debug(this.constructor.name, 'receivePacket', response);

    const packet = new OmniPacketResponse({
      response: response,
      sessionKey: this.sessionKey,
    });

    this.emit(packet.sequence.toString(), packet);
  }

  processPacket(packet: OmniPacket): SessionResponse | SecureConnectionResponse | ApplicationDataResponse | undefined {
    this.platform.log.debug(this.constructor.name, 'processPacket', packet.message);

    try {
      switch(packet.type) {
        case PacketTypes.NewSessionAcknowledge:
          return new SessionResponse(packet.message!);
        case PacketTypes.SecureConnectionAcknowledge:
          return new SecureConnectionResponse(packet.message!);
        case PacketTypes.ClientSessionTerminated:
        case PacketTypes.ControllerSessionTerminated:
        case PacketTypes.ControllerSessionFailed:
          return undefined;
        case PacketTypes.ApplicationData:
          return this.processMessage(packet.message!);
        default:
          throw new Error(`Packet type ${packet.type} not supported`);
      }
    } catch (error) {
      this.platform.log.warn(error.message);
    }
  }

  processMessage(message: Buffer): ApplicationDataResponse | undefined {
    this.platform.log.debug(this.constructor.name, 'processMessage', message);

    const type: MessageTypes = message[2];

    switch (type) {
      case MessageTypes.Acknowledge:
      case MessageTypes.NegativeAchnowledge:
      case MessageTypes.EndOfData:
        return new AcknowledgeResponse(message);
      case MessageTypes.SystemInformationResponse:
        return new SystemInformationResponse(message);
      case MessageTypes.SystemStatusResponse:
        return new SystemStatusResponse(message);
      case MessageTypes.ObjectTypeCapacitiesResponse:
        return new ObjectTypeCapacitiesResponse(message);
      case MessageTypes.SecurityCodeValidationResponse:
        return new SecurityCodeValidationResponse(message);
      case MessageTypes.ObjectPropertiesResponse:
        switch (<ObjectTypes>message[3]) {
          case ObjectTypes.Zone:
            return new ZonePropertiesResponse(message);
          case ObjectTypes.Button:
            return new ButtonPropertiesResponse(message);
          case ObjectTypes.Code:
            return new CodePropertiesResponse(message);
          case ObjectTypes.Area:
            return new AreaPropertiesResponse(message);
          default:
            this.platform.log.debug(`Object type ${message[3]} not supported for ObjectPropertiesResponse`);
            return;
        }
      case MessageTypes.ExtendedObjectStatusResponse:
        switch (<ObjectTypes>message[3]) {
          case ObjectTypes.Zone:
            return new ExtendedZoneStatusResponse(message);
          case ObjectTypes.Area:
            return new ExtendedAreaStatusResponse(message);
          default:
            this.platform.log.debug(`Object type ${message[3]} not supported for ExtendedObjectStatusResponse`);
            return;
        }
    }

    this.platform.log.debug(`Message type ${type} not supported`);
  }

  notificationHandler(packet: OmniPacket) {
    this.platform.log.debug(this.constructor.name, 'notificationHandler', packet);

    if (packet.message === undefined) {
      return;
    }

    const response = this.processMessage(packet.message);

    if (response instanceof ExtendedAreaStatusResponse) {
      this.emit('areas', response.areas);
    } else if (response instanceof ExtendedZoneStatusResponse) {
      this.emit('zones', response.zones);
    }
  }
}