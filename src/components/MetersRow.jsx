import { useState } from 'react'
import { useMotionValueEvent } from 'framer-motion'
import MeterBar from './MeterBar'
import { useGameStore } from '../store/gameStore'
import { dragX } from '../store/dragX'
import { METER_DEFS } from '../lib/meters'

const DEADBAND = 25
const MAX_INTENSITY_AT = 100

export default function MetersRow() {
  const meters = useGameStore((s) => s.meters)
  const card = useGameStore((s) => s.currentCard)
  const [active, setActive] = useState(null)
  const [intensity, setIntensity] = useState(0)

  useMotionValueEvent(dragX, 'change', (latest) => {
    const absX = Math.abs(latest)
    if (absX < DEADBAND) {
      if (active !== null) setActive(null)
      if (intensity !== 0) setIntensity(0)
    } else {
      const dir = latest < 0 ? 'left' : 'right'
      if (active !== dir) setActive(dir)
      const i = Math.min(1, (absX - DEADBAND) / (MAX_INTENSITY_AT - DEADBAND))
      setIntensity(i)
    }
  })

  const effects = active && card ? (card[active]?.effects ?? {}) : null

  return (
    <div className="meters-row">
      <div className="meters-grid">
        {METER_DEFS.map((m) => (
          <MeterBar
            key={m.id}
            id={m.id}
            name={m.name}
            icon={m.icon}
            value={meters[m.id]}
            accentColor={m.accent}
            previewDelta={effects?.[m.id] ?? 0}
            previewOpacity={effects ? intensity : 0}
          />
        ))}
      </div>
    </div>
  )
}
