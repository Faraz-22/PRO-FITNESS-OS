export class AdmsCommandBuilder {
  /**
   * Generates a command to add or update a user on the device.
   * Pri=0 means normal user, Pri=14 means admin, etc.
   */
  static syncUser(pin: string, name: string, pri: number = 0, card: string = ''): string {
    // Note: spaces in names might need specific ZKTeco encoding or just be truncated
    // Usually name length is limited (e.g. 24 chars)
    const safeName = name.substring(0, 24).replace(/[^a-zA-Z0-9 ]/g, '');
    let cmd = `DATA UPDATE userinfo PIN=${pin}\tName=${safeName}\tPri=${pri}`;
    if (card) {
      cmd += `\tCard=${card}`;
    }
    return cmd;
  }

  /**
   * Generates a command to delete a user from the device completely.
   */
  static deleteUser(pin: string): string {
    return `DATA DELETE userinfo PIN=${pin}`;
  }

  /**
   * Clears all attendance logs from the device.
   */
  static clearAttendance(): string {
    return `CLEAR LOG`;
  }
}
