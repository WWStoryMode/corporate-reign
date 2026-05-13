import { useEffect } from 'react'
import { useGameStore } from './store/gameStore'
import MetersRow from './components/MetersRow'
import CardStack from './components/CardStack'
import GameOver from './components/GameOver'
import './App.css'

function App() {
  const resetGame = useGameStore((s) => s.resetGame)
  const status = useGameStore((s) => s.status)

  useEffect(() => {
    if (status === 'idle') resetGame()
  }, [status, resetGame])

  return (
    <div className="game-root">
      <MetersRow />
      <CardStack />
      <GameOver />
    </div>
  )
}

export default App
