export interface MobileAttendanceDTO {
  id: string;
  entryTime: string;
  exitTime: string | null;
  durationMinutes: number | null;
  status: string;
}

export class AttendanceDTO {
  static toMobile(attendance: any /* eslint-disable-line @typescript-eslint/no-explicit-any */): MobileAttendanceDTO {
    return {
      id: attendance.id,
      entryTime: attendance.entryTime.toISOString(),
      exitTime: attendance.exitTime ? attendance.exitTime.toISOString() : null,
      durationMinutes: attendance.durationMinutes,
      status: attendance.status,
    };
  }
}
