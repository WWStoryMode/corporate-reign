# Corporate Reign — Game Design Spec
> Handoff document for Claude Code. Build a playable browser prototype.

---

## Concept

A Reigns-style swipe card game about the impossible balancing act of corporate leadership. You are the CEO. Advisors present dilemmas. Swipe right to accept, left to decline. Every decision shifts four resource meters. If any meter hits 0 or maxes out, the game ends.

Tone: dark satire. Real corporate scandals, fictional names. The player should feel clever, then feel guilty, then watch their carefully managed empire collapse from a decision they made 10 cards ago.

---

## Tech Stack

- **React** (Vite scaffold: `npm create vite@latest corporate-reign -- --template react`)
- **Framer Motion** — card drag, swipe detection, tilt-on-drag preview
- **Zustand** — global game state (meters, deck, bombs, quarter counter)
- **No UI library** — custom CSS, hand-crafted aesthetic
- **Data** — cards in `/src/data/cards.json`, no backend

---

## Project Structure

```
corporate-reign/
├── src/
│   ├── data/
│   │   └── cards.json          # All card content
│   ├── store/
│   │   └── gameStore.js        # Zustand store
│   ├── components/
│   │   ├── CardStack.jsx       # Drag/swipe card UI
│   │   ├── MeterBar.jsx        # Individual meter display
│   │   ├── MetersRow.jsx       # All four meters
│   │   ├── CharacterPortrait.jsx
│   │   ├── ChoicePreview.jsx   # Shows effect preview on drag
│   │   └── GameOver.jsx
│   ├── App.jsx
│   └── main.jsx
```

---

## The Four Meters

Each meter is an integer from 0–100. Starting value: 50. Game ends if any hits 0 or 100.

| ID | Name | Icon | Death at 0 | Death at 100 |
|---|---|---|---|---|
| `shareholders` | Shareholder Value | 💰 | Hostile takeover | Bubble + scandal |
| `management` | Management Power | 🏢 | Board coup | Autocracy revolt |
| `staff` | Staff Happiness | 😊 | Great resignation | Quiet quitting |
| `image` | Public Image | 🌍 | PR collapse | Overexposure crisis |

**Visual rule:** meter bar changes colour as it approaches danger zones.
- 20–80: neutral (colour-coded per meter)
- 10–20 or 80–90: amber warning pulse
- 0–10 or 90–100: red danger flash

---

## Card Data Schema

```json
{
  "id": "bro-001",
  "arc": "bro_culture",
  "chain": null,
  "type": "character",
  "character": {
    "name": "The HR Director",
    "role": "People Operations",
    "avatarInitials": "HR",
    "accentColor": "#4ca89a"
  },
  "text": "An engineer has filed a harassment complaint against her team lead. He's one of our best performers. HR recommends quietly moving her to another division to avoid disruption.",
  "left": {
    "label": "Approve the transfer",
    "effects": { "shareholders": 5, "management": 0, "staff": -15, "image": 0 },
    "plant_bomb": "bro-bomb-001",
    "bomb_delay": 8
  },
  "right": {
    "label": "Investigate properly",
    "effects": { "shareholders": -8, "management": 0, "staff": 12, "image": 10 },
    "plant_bomb": null,
    "unlock_chain": null
  },
  "flavor": "The transfer was approved. She moved teams. He got a performance bonus."
}
```

### Field Reference

| Field | Type | Description |
|---|---|---|
| `id` | string | Unique card ID |
| `arc` | string | Which scandal arc this belongs to |
| `chain` | string \| null | ID of the card that must be played before this one unlocks |
| `type` | `"character"` \| `"chain"` \| `"bomb"` \| `"quarterly"` \| `"wildcard"` | Card category |
| `character` | object | Speaker details |
| `text` | string | The dilemma text shown on card |
| `left.effects` | object | Delta applied to each meter on left swipe |
| `left.plant_bomb` | string \| null | Card ID to inject into deck N cards later |
| `left.bomb_delay` | int | How many cards until the bomb detonates |
| `left.unlock_chain` | string \| null | Card ID to add to deck immediately |
| `right.*` | same | Same fields for right swipe |
| `flavor` | string | Short ironic footnote shown after choice |

---

## Zustand Store Shape

```js
{
  // meters
  meters: { shareholders: 50, management: 50, staff: 50, image: 50 },

  // deck state
  deck: [],           // shuffled card IDs to draw from
  currentCard: null,  // active card object
  cardIndex: 0,       // how many cards played this session

  // quarter system
  quarter: 1,         // increments every 4 cards
  quarterProgress: 0, // 0-3 within current quarter

  // bomb queue: array of { cardId, detonatesAt }
  bombQueue: [],

  // chain unlocks: set of card IDs now available
  unlockedChains: new Set(),

  // game status
  status: 'playing', // 'playing' | 'game_over'
  gameOverReason: null,

  // actions
  swipeCard(direction),   // 'left' | 'right'
  drawNextCard(),
  checkGameOver(),
  resetGame(),
}
```

---

## Core Game Loop

```
drawNextCard()
  → check bombQueue: if cardIndex matches any detonatesAt, inject that card next
  → check quarterProgress: if === 4, draw quarterly card instead, reset to 0
  → otherwise draw next from shuffled deck

swipeCard(direction)
  → apply effects delta to meters (clamp 0–100)
  → if plant_bomb: push { cardId, detonatesAt: cardIndex + bomb_delay } to bombQueue
  → if unlock_chain: add cardId to unlockedChains
  → checkGameOver()
  → drawNextCard()

checkGameOver()
  → if any meter === 0 or === 100: set status = 'game_over', set gameOverReason
```

---

## Swipe Mechanics (Framer Motion)

Use `useMotionValue` for x position. Derive rotation and choice preview from x offset.

```jsx
const x = useMotionValue(0)
const rotate = useTransform(x, [-200, 200], [-18, 18])
const noOpacity = useTransform(x, [-100, 0], [1, 0])   // left label fades in
const yesOpacity = useTransform(x, [0, 100], [0, 1])   // right label fades in

// On drag end: if |x| > threshold (120px), commit the swipe
// Show meter effect preview as small +/- badges that appear while dragging
```

**On drag:**
- Card tilts ±18° based on drag distance
- Left side shows "✕ [No label]" in red, fading in
- Right side shows "✓ [Yes label]" in green, fading in
- Meter pip indicators animate to show predicted new values

**On release past threshold:**
- Card flies off screen in swipe direction
- Next card animates up from below

---

## Card Content (Prototype Deck — 18 cards)

Six arcs, three cards each. Load order for prototype:

1. `bro-001` → regular draw
2. `bro-bomb-001` → detonates 8 cards after `bro-001` left swipe
3. `bro-chain-001` → unlocked after `bro-bomb-001`
4. `theranos-001` → regular draw
5. `theranos-002` → regular draw
6. `theranos-bomb-001` → latent
7. `boeing-001` → regular draw
8. `boeing-002` → regular draw
9. `boeing-quarterly-001` → quarterly card (fires every 4th card)
10. `wework-001` → regular draw
11. `wework-002` → regular draw
12. `wework-chain-001` → chain after `wework-002` left swipe
13. `vw-001` → regular draw
14. `vw-chain-001` → chain after `vw-001` left swipe
15. `surveillance-001` → regular draw
16. `surveillance-002` → regular draw
17. `surveillance-bomb-001` → latent
18. `quarterly-board-review` → quarterly card

Full card content for all 18 is in the previous design session. Copy from the "Real-world reference cards" widget.

---

## Visual Design Direction

**Aesthetic:** Corporate gothic. Like a Succession title card crossed with a Tarot deck.

- **Background:** Near-black `#0e0d0b`, slight warm tint
- **Card:** Cream/parchment `#f5f0e8`, dark text. Physical card feel.
- **Typography:** Playfair Display (card text, game title) + DM Mono (UI, meters, labels)
- **Meters:** Four thin bars at top. Colour-coded: gold / red / teal / blue
- **Character portrait:** Initials in a circle, colour-coded by faction
- **Flavor text:** Small italic line at bottom of card after choice, fades in

**Card anatomy (top to bottom):**
```
┌─────────────────────────────┐
│  [Character name + role]    │
│  ────────────────────────   │
│                             │
│  [Dilemma text, 2-3 lines]  │
│                             │
│  ────────────────────────   │
│  ← No          Yes →        │
└─────────────────────────────┘
```

---

## Prototype Sequencing Rules (Minimal)

For the first playthrough, use these simple rules rather than full arc progression:

1. Shuffle the 18 cards into a deck at game start
2. Bombs are injected at `cardIndex + delay` regardless of arc
3. Quarterly cards fire at card 4, 8, 12, 16 (override whatever was next)
4. Starting meters: all at 50
5. No saving, no persistent state — single session prototype

This is intentionally simple. After one playthrough, revise the sequencing.

---

## Game Over Screen

Show the ending type, a one-line cause, and the card count (how long they lasted).

| Condition | Name | Epitaph |
|---|---|---|
| shareholders → 0 | Hostile Takeover | "The board accepted the acquisition offer. You were not part of the deal." |
| shareholders → 100 | Bubble Burst | "The investigation began on a Tuesday. By Thursday, you were trending." |
| management → 0 | Board Coup | "A unanimous vote. They didn't even tell you in person." |
| management → 100 | Autocracy | "They all left on the same day. Nobody sent a resignation email." |
| staff → 0 | Great Resignation | "The offices emptied in three weeks. The ping-pong table remained." |
| staff → 100 | Quiet Quitting | "Everyone smiled. Nobody worked. The quarterly targets were missed by 40%." |
| image → 0 | PR Collapse | "The hashtag trended for nine days. The advertisers left on day two." |
| image → 100 | Overexposure | "The documentary was actually very well made. That was the problem." |

---

## Running Locally

```bash
npm create vite@latest corporate-reign -- --template react
cd corporate-reign
npm install framer-motion zustand
npm run dev
```

Then replace `src/` with the component structure above.

---

## What to Build First in Claude Code

1. `gameStore.js` — Zustand store with all state and actions
2. `cards.json` — paste in the 18 prototype cards
3. `MeterBar.jsx` + `MetersRow.jsx` — meters display with colour states
4. `CardStack.jsx` — the draggable card with Framer Motion
5. `App.jsx` — wire everything together
6. `GameOver.jsx` — ending screen

Build in that order. Test the drag mechanic after step 4 before wiring game logic.
