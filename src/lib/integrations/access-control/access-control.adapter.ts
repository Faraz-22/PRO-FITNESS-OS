export interface DeviceInfo {
  manufacturer: string;
  model: string;
  serialNumber: string;
  firmwareVersion?: string;
  capacity?: {
    users: number;
    fingerprints: number;
    faces: number;
    events: number;
  };
}

export interface DeviceStatus {
  online: boolean;
  lastSeenAt: Date;
  uptimeSeconds?: number;
}

export interface RawDeviceEvent {
  externalEventId: string;
  externalUserId: string;
  timestamp: Date;
  eventType: string;
  rawPayload: Record<string, unknown>;
}

export interface AccessControlAdapter {
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  
  getDeviceStatus(): Promise<DeviceStatus>;
  getDeviceInfo(): Promise<DeviceInfo>;
  
  syncUser(externalUserId: string, name: string): Promise<void>;
  removeUser(externalUserId: string): Promise<void>;
  disableUser(externalUserId: string): Promise<void>;
  enableUser(externalUserId: string): Promise<void>;
  
  getAttendanceEvents(since: Date): Promise<RawDeviceEvent[]>;
  subscribeToEvents?(callback: (event: RawDeviceEvent) => void): void;
  
  openDoor?(): Promise<void>;
  healthCheck(): Promise<{ ok: boolean; error?: string }>;
}
