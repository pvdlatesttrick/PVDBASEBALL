import type { Player } from '@/types/player'
import type { BattedBallEvent } from '@/types/battedBall'
import { polarToSvg } from '@/data/ballparks'
import { SPRAY_EVENTS_BY_PLAYER_NAME } from '@/data/sprayChartData.gen'

export type { BattedBallEvent }

/**
 * Procedural batted-ball events per hitter (filtered by `playerId` via `getSprayEventsForPlayer`).
 * Volume: ADP ≤50 → 80–120; ADP 51–200 → 40–60; else fewer.
 */

const OPP = [
  'vs NYY',
  'vs BOS',
  'vs LAD',
  'vs ATL',
  'vs HOU',
  'vs TEX',
  'vs SEA',
  'vs TOR',
  'vs TBR',
  'vs MIL',
  'vs PHI',
  'vs SDP',
  'vs SFG',
  'vs CHC',
  'vs STL',
]

const LINES = [
  '2-for-4, 2B, BB, R',
  '1-for-3, HR, 2 RBI',
  '3-for-5, 2 2B, 3 R',
  '0-for-4, 2 K',
  '2-for-4, BB, SB',
  '4-for-4, 2 HR, 5 RBI',
  '1-for-4, 2B',
  '2-for-3, BB, R',
]

function mulberry32(seed: number) {
  return function () {
    let t = (seed += 0x6d2b79f5)
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** Pick hit type from barrel rate and randomness. */
function pickOutcome(
  rng: () => number,
  barrel: number
): BattedBallEvent['type'] {
  const b = barrel / 100
  const r = rng()
  const hrBoost = b * 0.12
  const hitBoost = b * 0.08
  if (r < 0.06 + hrBoost) return 'hr'
  if (r < 0.09 + hrBoost + hitBoost) return 'triple'
  if (r < 0.26 + hitBoost) return 'double'
  if (r < 0.48 + hitBoost) return 'single'
  if (r < 0.64) return 'groundout'
  if (r < 0.79) return 'flyout'
  if (r < 0.91) return 'lineout'
  return 'popout'
}

function isHit(t: BattedBallEvent['type']): boolean {
  return t === 'single' || t === 'double' || t === 'triple' || t === 'hr'
}

/** Angle (deg): + = LF side (pull for RHB). Skew using pull/oppo/center. */
function sampleAngle(rng: () => number, pullPct: number, oppoPct: number, centerPct: number): number {
  const p = rng()
  const pull = pullPct / 100
  const oppo = oppoPct / 100
  const cen = centerPct / 100
  const n = pull + oppo + cen || 1
  const pp = pull / n
  const po = oppo / n
  if (p < pp) {
    return 12 + rng() * 33
  }
  if (p < pp + po) {
    return -12 - rng() * 33
  }
  return (rng() - 0.5) * 22
}

function depthForType(
  type: BattedBallEvent['type'],
  rng: () => number
): { depthFt: number; la: number; ev: number } {
  switch (type) {
    case 'hr':
      return {
        depthFt: 360 + rng() * 95,
        la: 18 + rng() * 18,
        ev: 98 + rng() * 12,
      }
    case 'triple':
      return { depthFt: 300 + rng() * 55, la: 8 + rng() * 18, ev: 92 + rng() * 10 }
    case 'double':
      return { depthFt: 260 + rng() * 70, la: 4 + rng() * 22, ev: 88 + rng() * 12 }
    case 'single':
      return { depthFt: 160 + rng() * 120, la: -5 + rng() * 25, ev: 82 + rng() * 15 }
    case 'lineout':
      return { depthFt: 200 + rng() * 140, la: 8 + rng() * 22, ev: 90 + rng() * 14 }
    case 'flyout':
      return { depthFt: 240 + rng() * 120, la: 22 + rng() * 28, ev: 84 + rng() * 14 }
    case 'groundout':
      return { depthFt: 110 + rng() * 95, la: -18 + rng() * 12, ev: 78 + rng() * 18 }
    case 'popout':
      return { depthFt: 140 + rng() * 80, la: 38 + rng() * 35, ev: 72 + rng() * 16 }
    default:
      return { depthFt: 200, la: 10, ev: 85 }
  }
}

/**
 * Procedural batted-ball events (no static megabyte import).
 * Top players by ADP get more samples; pull/oppo/center skew angles.
 */
export function getSprayEventsForPlayer(player: Player): BattedBallEvent[] {
  if (!player.hitting || player.advanced.kind !== 'hitter') return []

  const real = SPRAY_EVENTS_BY_PLAYER_NAME[player.name]
  if (real?.length) return real

  const adv = player.advanced
  const barrel = adv.barrelPct
  const pullPct = adv.pullPct
  const oppoPct = adv.oppoPct
  const centerPct = adv.centerPct

  /** Tier by fantasy ADP proxy: top 50 → 80–120; 51–200 → 40–60; else fewer. */
  let n: number
  if (player.adp <= 50) {
    n = 80 + (player.id % 41)
  } else if (player.adp <= 200) {
    n = 40 + (player.id % 21)
  } else {
    n = 28 + (player.id % 8)
  }

  const rng = mulberry32(player.id * 977 + Math.floor(player.adp * 10))

  const out: BattedBallEvent[] = []
  for (let i = 0; i < n; i++) {
    const type = pickOutcome(rng, barrel)
    const { depthFt, la, ev } = depthForType(type, rng)
    let angle = sampleAngle(rng, pullPct, oppoPct, centerPct)
    angle += (rng() - 0.5) * 14
    angle = Math.max(-44, Math.min(44, angle))

    const jitterD = (rng() - 0.5) * 22
    const p = polarToSvg(Math.max(45, depthFt + jitterD), angle)
    let x = p.x + (rng() - 0.5) * 14
    let y = p.y + (rng() - 0.5) * 12

    x = Math.max(40, Math.min(460, x))
    y = Math.max(28, Math.min(415, y))

    const exitVelo = Math.round((ev + (rng() - 0.5) * 6) * 10) / 10
    const launchAngle = Math.round((la + (rng() - 0.5) * 4) * 10) / 10
    const hardHit = exitVelo >= 95

    let distance = depthFt
    if (type === 'hr') distance = 380 + rng() * 70
    else if (isHit(type)) distance = depthFt
    else distance = depthFt * (0.85 + rng() * 0.2)

    distance = Math.round(distance)

    const month = 3 + Math.floor(rng() * 6)
    const day = 1 + Math.floor(rng() * 27)
    const date = `2024-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`

    out.push({
      id: player.id * 100000 + i,
      playerId: player.id,
      date,
      opponent: OPP[Math.floor(rng() * OPP.length)]!,
      x,
      y,
      type,
      exitVelo,
      launchAngle,
      distance,
      hardHit,
      pitcherHand: rng() < 0.28 ? 'L' : 'R',
      gameBoxScore: {
        playerLine: LINES[Math.floor(rng() * LINES.length)]!,
        teamScore: `${player.team} ${4 + Math.floor(rng() * 6)}, OPP ${2 + Math.floor(rng() * 6)}`,
      },
    })
  }

  return out
}
