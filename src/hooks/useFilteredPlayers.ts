import { useMemo } from 'react'
import type { Player } from '@/types/player'
import type { ConsensusPlayer } from '@/types/consensus'
import { matchesPositionTab } from '@/utils/positionFilter'
import { findPlayerIdByName } from '@/utils/playerLookup'

export type PlayerAvailFilter = 'all' | 'available' | 'drafted'

export type PlayerFilterState = {
  search: string
  team: string
  league: 'all' | 'AL' | 'NL'
  positionTab: string
  status: PlayerAvailFilter
}

function matchesDraftPlayer(
  p: Player,
  drafted: boolean,
  filters: PlayerFilterState
): boolean {
  const q = filters.search.trim().toLowerCase()
  if (q && !p.name.toLowerCase().includes(q)) return false
  if (filters.league !== 'all' && p.league !== filters.league) return false
  if (filters.team !== 'all' && p.team !== filters.team) return false
  if (filters.positionTab !== 'all' && !matchesPositionTab(p.pos, filters.positionTab)) return false
  if (filters.status === 'available' && drafted) return false
  if (filters.status === 'drafted' && !drafted) return false
  return true
}

/** Draft board: preserve `order`, filter by id. */
export function useFilteredPlayerIds(
  order: number[],
  playersById: Map<number, Player>,
  draftedMap: Record<number, boolean>,
  filters: PlayerFilterState
): number[] {
  return useMemo(() => {
    return order.filter((id) => {
      const p = playersById.get(id)
      if (!p) return false
      const d = draftedMap[id] ?? p.drafted
      return matchesDraftPlayer(p, d, filters)
    })
  }, [order, playersById, draftedMap, filters])
}

/** Consensus rows: draft status applies when name matches PLAYERS. */
export function useFilteredConsensusPlayers(
  rows: ConsensusPlayer[],
  playersById: Map<number, Player>,
  draftedMap: Record<number, boolean>,
  filters: PlayerFilterState
): ConsensusPlayer[] {
  return useMemo(() => {
    const q = filters.search.trim().toLowerCase()
    return rows.filter((row) => {
      if (q && !row.name.toLowerCase().includes(q)) return false
      if (filters.league !== 'all' && row.league !== filters.league) return false
      if (filters.team !== 'all' && row.team !== filters.team) return false
      if (filters.positionTab !== 'all' && !matchesPositionTab(row.pos, filters.positionTab)) return false
      const pid = findPlayerIdByName(playersById, row.name)
      const drafted = pid !== undefined ? draftedMap[pid] ?? false : false
      if (filters.status === 'available' && drafted) return false
      if (filters.status === 'drafted' && !drafted) return false
      return true
    })
  }, [rows, playersById, draftedMap, filters])
}
