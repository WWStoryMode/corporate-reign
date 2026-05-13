import { create } from 'zustand'
import cardsData from '../data/cards.json' with { type: 'json' }

const METER_KEYS = ['shareholders', 'management', 'staff', 'image']
const INITIAL_METERS = { shareholders: 50, management: 50, staff: 50, image: 50 }

const ENDINGS = {
  shareholders_0: {
    name: 'Hostile Takeover',
    epitaph: 'The board accepted the acquisition offer. You were not part of the deal.',
  },
  shareholders_100: {
    name: 'Bubble Burst',
    epitaph: 'The investigation began on a Tuesday. By Thursday, you were trending.',
  },
  management_0: {
    name: 'Board Coup',
    epitaph: "A unanimous vote. They didn't even tell you in person.",
  },
  management_100: {
    name: 'Autocracy',
    epitaph: 'They all left on the same day. Nobody sent a resignation email.',
  },
  staff_0: {
    name: 'Great Resignation',
    epitaph: 'The offices emptied in three weeks. The ping-pong table remained.',
  },
  staff_100: {
    name: 'Quiet Quitting',
    epitaph: 'Everyone smiled. Nobody worked. The quarterly targets were missed by 40%.',
  },
  image_0: {
    name: 'PR Collapse',
    epitaph: 'The hashtag trended for nine days. The advertisers left on day two.',
  },
  image_100: {
    name: 'Overexposure',
    epitaph: 'The documentary was actually very well made. That was the problem.',
  },
}

const DECK_EXHAUST_ENDING = {
  name: 'Out of Crises',
  epitaph: 'You ran out of cards. The world ran out of patience.',
}

function clamp(v) {
  return Math.max(0, Math.min(100, v))
}

function buildCardsById(cards) {
  return Object.fromEntries(cards.map((c) => [c.id, c]))
}

function fisherYates(arr, rng) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function buildBaseDeckIds(cards) {
  return cards.filter((c) => c.type === 'character' && c.chain === null).map((c) => c.id)
}

function findUnplayedQuarterly(cardsById, playedIds) {
  for (const c of Object.values(cardsById)) {
    if (c.type === 'quarterly' && !playedIds.has(c.id)) return c
  }
  return null
}

function endingForMeters(meters) {
  for (const k of METER_KEYS) {
    if (meters[k] <= 0) return { key: `${k}_0`, ...ENDINGS[`${k}_0`] }
    if (meters[k] >= 100) return { key: `${k}_100`, ...ENDINGS[`${k}_100`] }
  }
  return null
}

const cardsById = buildCardsById(cardsData)

export const useGameStore = create((set, get) => ({
  cardsById,
  meters: { ...INITIAL_METERS },
  deck: [],
  currentCard: null,
  cardIndex: 0,
  quarter: 1,
  quarterProgress: 0,
  bombQueue: [],
  pendingNext: [],
  unlockedChains: new Set(),
  playedIds: new Set(),
  status: 'idle',
  gameOverReason: null,
  lastFlavor: null,

  resetGame: (options = {}) => {
    const rng = options.rng ?? Math.random
    const baseIds = options.deckOverride ?? fisherYates(buildBaseDeckIds(cardsData), rng)

    set({
      meters: { ...INITIAL_METERS },
      deck: baseIds,
      currentCard: null,
      cardIndex: 0,
      quarter: 1,
      quarterProgress: 0,
      bombQueue: [],
      pendingNext: [],
      unlockedChains: new Set(),
      playedIds: new Set(),
      status: 'playing',
      gameOverReason: null,
      lastFlavor: null,
    })

    get()._drawNextCard()
  },

  swipeCard: (direction) => {
    const state = get()
    if (state.status !== 'playing' || !state.currentCard) return
    if (direction !== 'left' && direction !== 'right') return

    const card = state.currentCard
    const choice = card[direction]
    if (!choice) return

    const newMeters = { ...state.meters }
    for (const k of METER_KEYS) {
      newMeters[k] = clamp(newMeters[k] + (choice.effects?.[k] ?? 0))
    }

    const newBombQueue = [...state.bombQueue]
    if (choice.plant_bomb) {
      if (state.cardsById[choice.plant_bomb]) {
        newBombQueue.push({
          cardId: choice.plant_bomb,
          detonatesAt: state.cardIndex + (choice.bomb_delay ?? 0),
        })
      } else {
        console.warn(
          `[gameStore] card "${card.id}" plants unknown bomb "${choice.plant_bomb}" — skipping`,
        )
      }
    }

    const newDeck = [...state.deck]
    const newUnlockedChains = new Set(state.unlockedChains)
    if (
      choice.unlock_chain &&
      state.cardsById[choice.unlock_chain] &&
      !newUnlockedChains.has(choice.unlock_chain) &&
      !state.playedIds.has(choice.unlock_chain)
    ) {
      const pos = Math.floor(Math.random() * (newDeck.length + 1))
      newDeck.splice(pos, 0, choice.unlock_chain)
      newUnlockedChains.add(choice.unlock_chain)
    }

    const newPendingNext = [...state.pendingNext]
    for (const candidate of Object.values(state.cardsById)) {
      if (
        candidate.type === 'chain' &&
        candidate.chain === card.id &&
        candidate.chainTrigger === direction &&
        !state.playedIds.has(candidate.id) &&
        !newPendingNext.includes(candidate.id)
      ) {
        newPendingNext.push(candidate.id)
      }
    }

    set({
      meters: newMeters,
      bombQueue: newBombQueue,
      deck: newDeck,
      unlockedChains: newUnlockedChains,
      pendingNext: newPendingNext,
      lastFlavor: card.flavor ?? null,
    })

    const ending = endingForMeters(newMeters)
    if (ending) {
      set({ status: 'game_over', gameOverReason: ending })
      return
    }

    get()._drawNextCard()
  },

  _drawNextCard: () => {
    const state = get()
    if (state.status !== 'playing') return

    const nextIndex = state.cardIndex + 1
    let drawnCard = null
    let drewQuarterly = false

    const newPendingNext = [...state.pendingNext]
    if (newPendingNext.length > 0) {
      const id = newPendingNext.shift()
      drawnCard = state.cardsById[id] ?? null
    }

    const newBombQueue = [...state.bombQueue]
    if (!drawnCard) {
      const bombIdx = newBombQueue.findIndex((b) => b.detonatesAt === nextIndex)
      if (bombIdx !== -1) {
        const { cardId } = newBombQueue[bombIdx]
        newBombQueue.splice(bombIdx, 1)
        drawnCard = state.cardsById[cardId] ?? null
      }
    }

    const newPlayedIds = new Set(state.playedIds)
    if (!drawnCard && nextIndex % 4 === 0) {
      const q = findUnplayedQuarterly(state.cardsById, newPlayedIds)
      if (q) {
        drawnCard = q
        drewQuarterly = true
      }
    }

    const newDeck = [...state.deck]
    if (!drawnCard) {
      while (newDeck.length > 0 && !drawnCard) {
        const id = newDeck.shift()
        if (newPlayedIds.has(id)) continue
        drawnCard = state.cardsById[id] ?? null
      }
    }

    if (!drawnCard) {
      set({
        status: 'game_over',
        gameOverReason: DECK_EXHAUST_ENDING,
        bombQueue: newBombQueue,
        pendingNext: newPendingNext,
        deck: newDeck,
      })
      return
    }

    newPlayedIds.add(drawnCard.id)

    let newQuarter = state.quarter
    let newQuarterProgress = state.quarterProgress + 1
    if (drewQuarterly) {
      newQuarter += 1
      newQuarterProgress = 0
    }

    set({
      cardIndex: nextIndex,
      currentCard: drawnCard,
      pendingNext: newPendingNext,
      bombQueue: newBombQueue,
      deck: newDeck,
      playedIds: newPlayedIds,
      quarter: newQuarter,
      quarterProgress: newQuarterProgress,
    })
  },
}))
