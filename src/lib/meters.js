export const METER_DEFS = [
  { id: 'shareholders', name: 'Shareholders', icon: '💰', accent: 'var(--accent-shareholders)' },
  { id: 'management', name: 'Management', icon: '🏢', accent: 'var(--accent-management)' },
  { id: 'staff', name: 'Staff', icon: '😊', accent: 'var(--accent-staff)' },
  { id: 'image', name: 'Public Image', icon: '🌍', accent: 'var(--accent-image)' },
]

export function meterZone(value) {
  if (value <= 10 || value >= 90) return 'danger'
  if (value <= 20 || value >= 80) return 'warning'
  return 'neutral'
}

export function formatDelta(n) {
  const v = n ?? 0
  if (v === 0) return '±0'
  return v > 0 ? `+${v}` : `${v}`
}
