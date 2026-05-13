import { useGameStore } from '../store/gameStore'

export default function GameOver() {
  const status = useGameStore((s) => s.status)
  const reason = useGameStore((s) => s.gameOverReason)
  const cardIndex = useGameStore((s) => s.cardIndex)
  const resetGame = useGameStore((s) => s.resetGame)

  if (status !== 'game_over' || !reason) return null

  return (
    <div className="game-over-overlay" role="dialog" aria-modal="true">
      <div className="game-over-card">
        <h2 className="game-over-name">{reason.name}</h2>
        <p className="game-over-epitaph">{reason.epitaph}</p>
        <p className="game-over-count">
          You lasted {cardIndex} {cardIndex === 1 ? 'card' : 'cards'}.
        </p>
        <button className="game-over-button" onClick={() => resetGame()}>
          Play Again
        </button>
      </div>
    </div>
  )
}
