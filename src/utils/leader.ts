export function isLeaderUser(raw: unknown): boolean {
  if (raw === true) return true
  if (raw === false || raw == null) return false
  if (typeof raw === 'number') return raw === 1
  if (typeof raw === 'string') {
    const v = raw.trim().toLowerCase()
    return v === '1' || v === 'true' || v === 'yes'
  }
  return false
}

