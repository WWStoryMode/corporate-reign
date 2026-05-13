import { useEffect } from 'react'
import {
  animate,
  AnimatePresence,
  motion,
  useMotionValue,
  useMotionValueEvent,
  useTransform,
} from 'framer-motion'
import { useGameStore } from '../store/gameStore'
import { dragX as globalDragX } from '../store/dragX'
import CharacterPortrait from './CharacterPortrait'

const SWIPE_THRESHOLD = 120
const FLY_OFF_DISTANCE = 600

function CardView({ card, onSwipe }) {
  const x = useMotionValue(0)
  const rotate = useTransform(x, [-200, 200], [-18, 18])
  const noOpacity = useTransform(x, [-100, -20], [1, 0], { clamp: true })
  const yesOpacity = useTransform(x, [20, 100], [0, 1], { clamp: true })

  useMotionValueEvent(x, 'change', (v) => globalDragX.set(v))

  useEffect(() => {
    return () => globalDragX.set(0)
  }, [])

  const handleDragEnd = (_, info) => {
    if (info.offset.x < -SWIPE_THRESHOLD) {
      animate(x, -FLY_OFF_DISTANCE, {
        type: 'tween',
        duration: 0.22,
        onComplete: () => onSwipe('left'),
      })
    } else if (info.offset.x > SWIPE_THRESHOLD) {
      animate(x, FLY_OFF_DISTANCE, {
        type: 'tween',
        duration: 0.22,
        onComplete: () => onSwipe('right'),
      })
    }
  }

  return (
    <motion.article
      className="card"
      style={{ x, rotate }}
      drag="x"
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.7}
      onDragEnd={handleDragEnd}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.18 }}
    >
      <CharacterPortrait character={card.character} />
      <div className="card-divider" />
      <p className="card-text">{card.text}</p>
      <div className="card-divider" />
      <div className="card-choices">
        <motion.span className="choice-label choice-left" style={{ opacity: noOpacity }}>
          ✕ {card.left?.label}
        </motion.span>
        <motion.span className="choice-label choice-right" style={{ opacity: yesOpacity }}>
          {card.right?.label} ✓
        </motion.span>
      </div>
    </motion.article>
  )
}

export default function CardStack() {
  const card = useGameStore((s) => s.currentCard)
  const swipeCard = useGameStore((s) => s.swipeCard)

  if (!card) return null

  return (
    <div className="card-stack">
      <AnimatePresence mode="wait" initial={false}>
        <CardView key={card.id} card={card} onSwipe={swipeCard} />
      </AnimatePresence>
    </div>
  )
}
