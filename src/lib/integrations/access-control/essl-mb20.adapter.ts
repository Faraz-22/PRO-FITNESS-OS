import { AccessControlAdapter, DeviceInfo, DeviceStatus, RawDeviceEvent } from './access-control.adapter';

/**
 * PENDING HARDWARE VERIFICATION
 * 
 * This is a Mock Adapter representing the eSSL MB20 biometric device.
 * It simulates device communication until the physical hardware and 
 * its associated SDK/API protocol can be verified on site.
 */
export class ESSLMB20MockAdapter implements AccessControlAdapter {
  private online = true;
  private connected = false;
  private users: Map<string, { name: string, enabled: boolean }> = new Map();
  private eventLog: RawDeviceEvent[] = [];

  async connect(): Promise<void> {
    this.connected = true;
    console.log('[MB20 Mock] Connected');
  }

  async disconnect(): Promise<void> {
    this.connected = false;
    console.log('[MB20 Mock] Disconnected');
  }

  async getDeviceStatus(): Promise<DeviceStatus> {
    return {
      online: this.online,
      lastSeenAt: new Date(),
      uptimeSeconds: 3600
    };
  }

  async getDeviceInfo(): Promise<DeviceInfo> {
    return {
      manufacturer: 'eSSL (MOCK)',
      model: 'MB20',
      serialNumber: 'MOCK-MB20-001',
      firmwareVersion: '1.0.0-MOCK',
      capacity: {
        users: 1000,
        fingerprints: 2000,
        faces: 1000,
        events: 50000
      }
    };
  }

  async syncUser(externalUserId: string, name: string): Promise<void> {
    this.requireConnection();
    this.users.set(externalUserId, { name, enabled: true });
    console.log(`[MB20 Mock] Synced user ${externalUserId} (${name})`);
  }

  async removeUser(externalUserId: string): Promise<void> {
    this.requireConnection();
    this.users.delete(externalUserId);
    console.log(`[MB20 Mock] Removed user ${externalUserId}`);
  }

  async disableUser(externalUserId: string): Promise<void> {
    this.requireConnection();
    const user = this.users.get(externalUserId);
    if (user) {
      user.enabled = false;
      console.log(`[MB20 Mock] Disabled user ${externalUserId}`);
    }
  }

  async enableUser(externalUserId: string): Promise<void> {
    this.requireConnection();
    const user = this.users.get(externalUserId);
    if (user) {
      user.enabled = true;
      console.log(`[MB20 Mock] Enabled user ${externalUserId}`);
    }
  }

  async getAttendanceEvents(since: Date): Promise<RawDeviceEvent[]> {
    this.requireConnection();
    return this.eventLog.filter(e => e.timestamp > since);
  }

  async healthCheck(): Promise<{ ok: boolean; error?: string }> {
    return { ok: this.online };
  }

  private requireConnection() {
    if (!this.connected) {
      throw new Error('Adapter not connected');
    }
  }

  // --- MOCK TESTING UTILITIES ---

  /** Simulates a user punching the device */
  simulateBiometricPunch(externalUserId: string, accessAllowed: boolean) {
    const event: RawDeviceEvent = {
      externalEventId: `evt_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      externalUserId,
      timestamp: new Date(),
      eventType: accessAllowed ? 'ACCESS_ALLOWED' : 'ACCESS_DENIED',
      rawPayload: { mock: true, authMode: 'FINGERPRINT', allowed: accessAllowed }
    };
    this.eventLog.push(event);
    return event;
  }
}
