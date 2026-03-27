import type { LineupSlot } from '@/types/matchup'
import type { PitcherGameLogEntry } from '@/data/pitcherGameLog'

export type BatterHandCounts = { lhh: number; rhh: number; sh: number }

/** Count L/R/S batters in a lineup (typically 9). */
export function countBatterHands(lineup: LineupSlot[]): BatterHandCounts {
  let lhh = 0
  let rhh = 0
  let sh = 0
  for (const b of lineup) {
    if (b.bats === 'L') lhh++
    else if (b.bats === 'R') rhh++
    else sh++
  }
  return { lhh, rhh, sh }
}

/** Normalized [L share, R share, S share] for similarity against historical logs. */
export function lineupCompositionVector(lineup: LineupSlot[]): [number, number, number] {
  const n = lineup.length || 1
  const c = countBatterHands(lineup)
  return [c.lhh / n, c.rhh / n, c.sh / n]
}

function cosineSimilarity(a: number[], b: number[]): number {
  let dot = 0
  let na = 0
  let nb = 0
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i]
    na += a[i] * a[i]
    nb += b[i] * b[i]
  }
  const d = Math.sqrt(na) * Math.sqrt(nb)
  return d === 0 ? 0 : dot / d
}

function logVector(entry: Pick<PitcherGameLogEntry, 'lineupLhh' | 'lineupRhh' | 'lineupSh'>): [
  number,
  number,
  number,
] {
  const n = entry.lineupLhh + entry.lineupRhh + entry.lineupSh || 1
  return [entry.lineupLhh / n, entry.lineupRhh / n, entry.lineupSh / n]
}

export type LineupComp = {
  entry: PitcherGameLogEntry
  similarity: number
}

/**
 * Historical games from this pitcher's log with most similar L/R/S lineup mix (cosine similarity).
 */
export function findSimilarLineupComps(
  lineup: LineupSlot[],
  pitcherLog: PitcherGameLogEntry[],
  topK = 5
): LineupComp[] {
  const v = lineupCompositionVector(lineup)
  const scored = pitcherLog.map((entry) => ({
    entry,
    similarity: cosineSimilarity(v, logVector(entry)),
  }))
  scored.sort((a, b) => b.similarity - a.similarity)
  return scored.slice(0, topK)
}
