import type { LineupSlot } from '@/types/matchup'
import type { PitcherPlatoonSplits } from '@/data/pitcherSplits'

const LEAGUE_ERA = 4.25
const LEAGUE_RUNS_PER_GAME = 4.35

/** Approximate park factors by venue name (hitter-friendly > 1). */
const PARK_FACTOR_BY_VENUE: Record<string, number> = {
  'Coors Field': 1.14,
  'Fenway Park': 1.05,
  'Globe Life Field': 1.02,
  'Citizens Bank Park': 1.04,
  'Oracle Park': 0.94,
  'Oriole Park at Camden Yards': 1.03,
  'Busch Stadium': 0.98,
  'Target Field': 1.0,
  'Oakland Coliseum': 0.96,
  'Wrigley Field': 1.02,
  'Dodger Stadium': 0.97,
}

export function getParkFactorForVenue(venue: string): number {
  return PARK_FACTOR_BY_VENUE[venue] ?? 1.0
}

export type RunProjectionSignal = 'green' | 'yellow' | 'red'

function blendedEraVsLineup(lineup: LineupSlot[], splits: PitcherPlatoonSplits): number {
  const n = lineup.length || 1
  let sum = 0
  for (const b of lineup) {
    if (b.bats === 'S') {
      sum += (splits.vsLHH.era + splits.vsRHH.era) / 2
    } else if (b.bats === 'L') {
      sum += splits.vsLHH.era
    } else {
      sum += splits.vsRHH.era
    }
  }
  return sum / n
}

export function projectExpectedRuns(
  lineup: LineupSlot[],
  splits: PitcherPlatoonSplits,
  venue: string
): { expectedRuns: number; signal: RunProjectionSignal } {
  const park = getParkFactorForVenue(venue)
  const blended = blendedEraVsLineup(lineup, splits)
  const expectedRuns = LEAGUE_RUNS_PER_GAME * park * (blended / LEAGUE_ERA)
  return { expectedRuns, signal: runProjectionSignal(expectedRuns) }
}

/** Green ≥5.0, yellow 3.5–4.9, red ≤3.4 (gap 3.41–3.49 → yellow). */
export function runProjectionSignal(expectedRuns: number): RunProjectionSignal {
  if (expectedRuns >= 5.0) return 'green'
  if (expectedRuns <= 3.4) return 'red'
  return 'yellow'
}

export function signalMeterClass(signal: RunProjectionSignal): string {
  switch (signal) {
    case 'green':
      return 'bg-emerald-500'
    case 'yellow':
      return 'bg-amber-400'
    default:
      return 'bg-rose-500'
  }
}

export function signalLabelClass(signal: RunProjectionSignal): string {
  switch (signal) {
    case 'green':
      return 'text-emerald-700 dark:text-emerald-300'
    case 'yellow':
      return 'text-amber-800 dark:text-amber-200'
    default:
      return 'text-rose-700 dark:text-rose-300'
  }
}
