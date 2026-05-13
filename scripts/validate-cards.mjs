#!/usr/bin/env node
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const cardsPath = resolve(__dirname, '..', 'src', 'data', 'cards.json')

const REQUIRED_TOP = ['id', 'arc', 'type', 'character', 'text', 'left', 'right', 'flavor']
const REQUIRED_CHOICE = ['label', 'effects', 'plant_bomb', 'bomb_delay', 'unlock_chain']
const METER_KEYS = ['shareholders', 'management', 'staff', 'image']
const VALID_TYPES = new Set(['character', 'chain', 'bomb', 'quarterly', 'wildcard'])

const failures = []
const fail = (id, msg) => failures.push(`[${id}] ${msg}`)

const raw = readFileSync(cardsPath, 'utf8')
let cards
try {
  cards = JSON.parse(raw)
} catch (err) {
  console.error('FAIL: cards.json is not valid JSON:', err.message)
  process.exit(1)
}

if (!Array.isArray(cards)) {
  console.error('FAIL: cards.json root is not an array')
  process.exit(1)
}

const EXPECTED_COUNT = 22
if (cards.length !== EXPECTED_COUNT) {
  fail('count', `expected ${EXPECTED_COUNT} cards, got ${cards.length}`)
}

const ids = new Set()
const byId = new Map()
for (const c of cards) {
  if (!c.id) {
    fail('?', 'missing id')
    continue
  }
  if (ids.has(c.id)) fail(c.id, 'duplicate id')
  ids.add(c.id)
  byId.set(c.id, c)
}

for (const c of cards) {
  const id = c.id ?? '?'

  for (const k of REQUIRED_TOP) {
    if (!(k in c)) fail(id, `missing top-level field "${k}"`)
  }

  if (c.type && !VALID_TYPES.has(c.type)) {
    fail(id, `unknown type "${c.type}"`)
  }

  if (c.character) {
    for (const k of ['name', 'role', 'avatarInitials', 'accentColor']) {
      if (!(k in c.character)) fail(id, `character missing "${k}"`)
    }
  }

  for (const side of ['left', 'right']) {
    const choice = c[side]
    if (!choice) continue
    for (const k of REQUIRED_CHOICE) {
      if (!(k in choice)) fail(id, `${side} missing "${k}"`)
    }
    if (choice.effects) {
      for (const m of METER_KEYS) {
        if (!(m in choice.effects)) fail(id, `${side}.effects missing meter "${m}"`)
        else if (typeof choice.effects[m] !== 'number') fail(id, `${side}.effects.${m} is not a number`)
      }
    }
    if (choice.plant_bomb !== null && choice.plant_bomb !== undefined) {
      if (!byId.has(choice.plant_bomb)) fail(id, `${side}.plant_bomb "${choice.plant_bomb}" does not resolve`)
    }
    if (choice.unlock_chain !== null && choice.unlock_chain !== undefined) {
      if (!byId.has(choice.unlock_chain)) fail(id, `${side}.unlock_chain "${choice.unlock_chain}" does not resolve`)
    }
  }

  if (c.chain !== null && c.chain !== undefined) {
    if (!byId.has(c.chain)) fail(id, `chain "${c.chain}" does not resolve`)
  }

  if (c.type === 'chain') {
    const hasTrigger = c.chainTrigger === 'left' || c.chainTrigger === 'right'
    const parent = c.chain ? byId.get(c.chain) : null
    const parentUnlocksThis = parent && (
      parent.left?.unlock_chain === c.id || parent.right?.unlock_chain === c.id
    )
    if (!hasTrigger && !parentUnlocksThis) {
      fail(id, 'chain card has neither chainTrigger nor a parent that unlocks it via unlock_chain')
    }
    if (hasTrigger && c.chainTrigger !== 'left' && c.chainTrigger !== 'right') {
      fail(id, `chainTrigger must be "left" or "right", got "${c.chainTrigger}"`)
    }
  }
}

if (failures.length) {
  console.error(`\n❌ ${failures.length} validation failure(s):`)
  for (const f of failures) console.error('  - ' + f)
  process.exit(1)
}

console.log(`✅ ${cards.length} cards valid.`)
console.log(`   • types: ${[...new Set(cards.map(c => c.type))].join(', ')}`)
console.log(`   • arcs:  ${[...new Set(cards.map(c => c.arc))].filter(Boolean).join(', ')}`)
