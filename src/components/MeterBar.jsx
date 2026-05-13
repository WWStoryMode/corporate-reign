import { meterZone, formatDelta } from '../lib/meters'

export default function MeterBar({
  id,
  name,
  icon,
  value,
  accentColor,
  previewDelta = 0,
  previewOpacity = 0,
}) {
  const zone = meterZone(value)
  const sign = previewDelta > 0 ? 'positive' : previewDelta < 0 ? 'negative' : 'zero'

  return (
    <div className={`meter-bar zone-${zone}`} data-meter={id} style={{ '--meter-accent': accentColor }}>
      <div className="meter-label">
        <span className="meter-icon" aria-hidden="true">{icon}</span>
        <span className="meter-name">{name}</span>
        <span className="meter-value">{value}</span>
      </div>
      <div className="meter-track">
        <div className="meter-fill" style={{ width: `${value}%` }} />
      </div>
      <div className="meter-preview-chip" data-sign={sign} style={{ opacity: previewOpacity }}>
        {formatDelta(previewDelta)}
      </div>
    </div>
  )
}
