export function recoverOriginalPhone(storedPhone: string | null): string | null {
  if (!storedPhone) return null;
  const match = storedPhone.match(/^del_\d+_(.*)$/);
  if (!match) return storedPhone;
  const recovered = (match[1] ?? '').trim();
  if (!recovered || recovered === 'null' || recovered === 'undefined') {
    return null;
  }
  return recovered;
}

export function recoverMemberEmail(
  storedEmail: string,
  memberNumber: string,
  loggedOriginalEmail?: string | null
): string {
  if (!storedEmail.startsWith('deleted_')) return storedEmail;
  if (loggedOriginalEmail && !loggedOriginalEmail.startsWith('deleted_')) {
    return loggedOriginalEmail;
  }
  return `temp_${memberNumber}@profitness.local`;
}
