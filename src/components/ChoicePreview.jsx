import { useState } from 'react'
import { useMotionValueEvent } from 'framer-motion'
import { dragX } from '../store/dragX'
import { useGameStore } from '../store/gameStore'
import { METER_DEFS, formatDelta } from '../lib/meters'

const DEADBAND = 25
const MAX_INTENSITY_AT = 100

export default function ChoicePreview() {
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

  if (!card || !active) return null
  const effects = card[active]?.effects ?? {}

  return (
    <div className="choice-preview" data-direction={active} style={{ opacity: intensity }}>
      {METER_DEFS.map((m) => {
        const delta = effects[m.id] ?? 0
        const sign = delta > 0 ? 'positive' : delta < 0 ? 'negative' : 'zero'
        return (
          <div key={m.id} className="choice-preview-cell">
            <span className="choice-preview-delta" data-sign={sign}>
              {formatDelta(delta)}
            </span>
          </div>
        )
      })}
    </div>
  )
}
