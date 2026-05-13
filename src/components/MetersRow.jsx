import MeterBar from './MeterBar'
import ChoicePreview from './ChoicePreview'
import { useGameStore } from '../store/gameStore'
import { METER_DEFS } from '../lib/meters'

export default function MetersRow() {
  const meters = useGameStore((s) => s.meters)
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
          />
        ))}
      </div>
      <ChoicePreview />
    </div>
  )
}
