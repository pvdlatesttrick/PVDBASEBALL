import { useMemo } from 'react'
import type { Player } from '@/types/player'
import { ROTO_KEYS, ROTO_LOWER_IS_BETTER, type RotoKey } from '@/types/player'

export type CategoryRankInfo = {
  /** 1 = best in pool */
  rank: number
  poolSize: number
  /** Points for this category (best gets poolSize) */
  points: number
}

export type RotoBreakdown = {
  totalPoints: number
  byCategory: Record<RotoKey, CategoryRankInfo>
}

function effectiveKbbPct(p: Player): number {
  if (p.role === 'hitter' && p.hitting) {
    return p.hitting.bbPct - p.hitting.kPct
  }
  return p.roto.kbbPct
}

export function getRotoValue(p: Player, key: RotoKey): number {
  switch (key) {
    case 'kbbPct':
      return effectiveKbbPct(p)
    default:
      return p.roto[key]
  }
}

/** Ties share average rank; category points split for tied rows. */
function categoryScores(
  poolIds: number[],
  getValue: (id: number) => number,
  lowerIsBetter: boolean
): Map<number, { rank: number; points: number }> {
  const n = poolIds.length
  const result = new Map<number, { rank: number; points: number }>()
  if (n === 0) return result

  const rows = poolIds.map((id) => ({ id, v: getValue(id) }))
  rows.sort((a, b) => {
    const cmp = lowerIsBetter ? a.v - b.v : b.v - a.v
    if (cmp !== 0) return cmp
    return a.id - b.id
  })

  let i = 0
  while (i < n) {
    let j = i + 1
    while (j < n && rows[j].v === rows[i].v) j++
    const size = j - i
    let pointSum = 0
    for (let k = 0; k < size; k++) pointSum += n - (i + k)
    const pointsEach = pointSum / size
    const rankStart = i + 1
    const rankEnd = j
    const avgRank = (rankStart + rankEnd) / 2
    for (let k = i; k < j; k++) {
      result.set(rows[k].id, { rank: avgRank, points: pointsEach })
    }
    i = j
  }
  return result
}

export function useRotoRankings(
  playersById: Map<number, Player>,
  poolIds: number[]
): Map<number, RotoBreakdown> {
  return useMemo(() => {
    const map = new Map<number, RotoBreakdown>()
    if (poolIds.length === 0) return map

    const byCat = {} as Record<RotoKey, Map<number, { rank: number; points: number }>>
    for (const key of ROTO_KEYS) {
      const lower = ROTO_LOWER_IS_BETTER.has(key)
      byCat[key] = categoryScores(
        poolIds,
        (id) => {
          const p = playersById.get(id)
          if (!p) return lower ? 9999 : -9999
          return getRotoValue(p, key)
        },
        lower
      )
    }

    for (const id of poolIds) {
      let total = 0
      const breakdown: Record<RotoKey, CategoryRankInfo> = {} as Record<
        RotoKey,
        CategoryRankInfo
      >
      for (const key of ROTO_KEYS) {
        const m = byCat[key].get(id)!
        total += m.points
        breakdown[key] = {
          rank: m.rank,
          poolSize: poolIds.length,
          points: m.points,
        }
      }
      map.set(id, { totalPoints: total, byCategory: breakdown })
    }
    return map
  }, [playersById, poolIds])
}
