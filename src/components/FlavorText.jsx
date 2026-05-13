import { useGameStore } from '../store/gameStore'

export default function FlavorText() {
  const lastFlavor = useGameStore((s) => s.lastFlavor)
  const cardIndex = useGameStore((s) => s.cardIndex)

  return (
    <div className="flavor-text-slot" aria-live="polite">
      {lastFlavor && (
        <p key={cardIndex} className="flavor-text">
          {lastFlavor}
        </p>
      )}
    </div>
  )
}
