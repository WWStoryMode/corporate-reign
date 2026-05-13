#!/usr/bin/env node
import { meterZone, formatDelta, METER_DEFS } from '../src/lib/meters.js'

let passed = 0
let failed = 0

function test(name, fn) {
  try {
    fn()
    passed += 1
    console.log(`✅ ${name}`)
  } catch (e) {
    failed += 1
    console.log(`❌ ${name}`)
    console.log(`   ${e.message}`)
  }
}

function assertEq(actual, expected, msg) {
  if (actual !== expected) {
    throw new Error(`${msg ?? 'assertEq'}: expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`)
  }
}

// Tests for meterZone — the visual zone classification driving 4.1, 4.2, 4.3
test('meterZone: neutral 21-79', () => {
  assertEq(meterZone(21), 'neutral')
  assertEq(meterZone(50), 'neutral')
  assertEq(meterZone(79), 'neutral')
})

test('meterZone: warning at 80 and 20 boundaries', () => {
  assertEq(meterZone(20), 'warning')
  assertEq(meterZone(80), 'warning')
  assertEq(meterZone(15), 'warning')
  assertEq(meterZone(85), 'warning')
})

test('meterZone: danger at 10 and 90 boundaries', () => {
  assertEq(meterZone(0), 'danger')
  assertEq(meterZone(10), 'danger')
  assertEq(meterZone(90), 'danger')
  assertEq(meterZone(100), 'danger')
  assertEq(meterZone(5), 'danger')
  assertEq(meterZone(95), 'danger')
})

// formatDelta — for ChoicePreview badges
test('formatDelta: zero shows ±0', () => {
  assertEq(formatDelta(0), '±0')
  assertEq(formatDelta(null), '±0')
  assertEq(formatDelta(undefined), '±0')
})

test('formatDelta: positive prefixes +', () => {
  assertEq(formatDelta(5), '+5')
  assertEq(formatDelta(18), '+18')
})

test('formatDelta: negative keeps -', () => {
  assertEq(formatDelta(-5), '-5')
  assertEq(formatDelta(-30), '-30')
})

// METER_DEFS sanity
test('METER_DEFS lists 4 meters in spec order', () => {
  assertEq(METER_DEFS.length, 4)
  assertEq(METER_DEFS[0].id, 'shareholders')
  assertEq(METER_DEFS[1].id, 'management')
  assertEq(METER_DEFS[2].id, 'staff')
  assertEq(METER_DEFS[3].id, 'image')
})

console.log(`\n${passed} passed, ${failed} failed`)
if (failed > 0) process.exit(1)
