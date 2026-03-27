import type { ConsensusPlayer } from '@/types/consensus'
import { RAW_ROSTER } from '@/data/rawRoster'
import { calcAvgRank, calcStdDev } from '@/utils/consensusStats'
import { getLeague } from '@/utils/teamLeague'

function clamp(n: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, n))
}

function tierFromRank(r: number): number {
  return Math.min(8, Math.max(1, Math.ceil(r / 38)))
}

function jitter(i: number, salt: number): number {
  return ((i * 7 + salt * 11) % 9) - 4
}

/** Top 300 by ADP — full fantasy pool lives in `RAW_ROSTER` / `PLAYERS`. */
const TOP_BY_ADP = [...RAW_ROSTER].sort((a, b) => a.adp - b.adp).slice(0, 300)

export const CONSENSUS_RANKINGS: ConsensusPlayer[] = TOP_BY_ADP.map((raw, i) => {
  const consensusRank = i + 1
  const base = consensusRank
  const espnRank = clamp(base + jitter(i, 0), 1, 600)
  const yahooRank = clamp(base + jitter(i, 1), 1, 600)
  const fangraphsRank = clamp(base + jitter(i, 2), 1, 600)
  const rotoballerRank = clamp(base + jitter(i, 3), 1, 600)
  const ranks = [espnRank, yahooRank, fangraphsRank, rotoballerRank]
  const avgRank = calcAvgRank(ranks)
  const stdDev = calcStdDev(ranks)
  const trends: Array<'up' | 'down' | 'stable'> = ['up', 'down', 'stable']
  const trend = trends[i % 3]
  let notes =
    '2025 preseason consensus snapshot; sources diverge on role and playing time—monitor spring news.'
  if (raw.name === 'Shohei Ohtani') {
    notes =
      'Two-way megastar; consensus ranks his hitting line here—still delivers SP1-caliber innings when healthy.'
  }
  return {
    id: i + 1,
    consensusRank,
    name: raw.name,
    pos: raw.pos,
    team: raw.team,
    league: getLeague(raw.team),
    tier: tierFromRank(consensusRank),
    espnRank,
    yahooRank,
    fangraphsRank,
    rotoballerRank,
    avgRank,
    stdDev,
    adp: raw.adp,
    posRank: raw.posRank,
    trend,
    notes,
  }
})
