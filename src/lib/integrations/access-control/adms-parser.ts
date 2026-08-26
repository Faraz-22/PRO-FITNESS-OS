export interface AdmsAttendanceLog {
  pin: string; // The Member's externalUserId on the device
  timestamp: Date;
  status: string; // usually '1' for check-in, '2' for check-out, etc.
  verifyType: string; // usually '1' for Fingerprint, '15' for Face, '4' for Card
  workCode: string;
}

export class AdmsParser {
  /**
   * Parses the raw ATTLOG body sent via POST /iclock/cdata
   * Format: PIN\tTime\tStatus\tVerifyType\tWorkCode\tReserved1\tReserved2\r\n
   */
  static parseAttendanceLogs(rawText: string): AdmsAttendanceLog[] {
    const logs: AdmsAttendanceLog[] = [];
    if (!rawText) return logs;

    const lines = rawText.split(/\r?\n/);
    
    for (const line of lines) {
      if (!line.trim()) continue;
      
      const parts = line.split('\t');
      if (parts.length >= 2) {
        const pin = parts[0]?.trim() || '';
        const timeStr = parts[1]?.trim() || ''; // e.g., '2026-08-22 08:30:00'
        
        let status = '0';
        let verifyType = '0';
        let workCode = '0';

        if (parts.length > 2) status = parts[2]?.trim() || '0';
        if (parts.length > 3) verifyType = parts[3]?.trim() || '0';
        if (parts.length > 4) workCode = parts[4]?.trim() || '0';

        // Time format is usually YYYY-MM-DD HH:mm:ss in device's local time.
        // We assume the device is configured in the correct timezone or we parse it as local.
        const timestamp = new Date(timeStr.replace(' ', 'T')); 

        if (!isNaN(timestamp.getTime())) {
          logs.push({
            pin,
            timestamp,
            status,
            verifyType,
            workCode,
          });
        }
      }
    }

    return logs;
  }

  /**
   * Generates a device command string for ADMS.
   */
  static buildCommandString(commandQueueId: string, cmd: string): string {
    return `C:${commandQueueId}:${cmd}`;
  }

  /**
   * Parses the return results of device commands posted to POST /iclock/devicecmd
   */
  static parseCommandResults(rawText: string): { queueId: string; returnCode: string }[] {
    const results = [];
    const lines = rawText.split(/\r?\n/);
    
    for (const line of lines) {
      if (!line.trim()) continue;
      
      const parts = line.split('&');
      const data: Record<string, string> = {};
      
      parts.forEach(p => {
        const [k, v] = p.split('=');
        if (k && v !== undefined) data[k.trim()] = v.trim();
      });

      if (data.ID && data.Return) {
        results.push({
          queueId: data.ID,
          returnCode: data.Return
        });
      }
    }
    
    return results;
  }
}
