import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useVirtualizer } from '@tanstack/react-virtual'
import type { Player } from '@/types/player'
import type { RotoKey } from '@/types/player'
import { ROTO_KEYS, getPlayerType, showsRotoCategory } from '@/types/player'
import { PositionPill } from '@/components/PositionPill'
import { FilterBar } from '@/components/FilterBar'
import { getRotoValue, useRotoRankings } from '@/hooks/useRotoRankings'
import {
  useFilteredPlayerIds,
  type PlayerAvailFilter,
  type PlayerFilterState,
} from '@/hooks/useFilteredPlayers'

export type SortColumn =
  | 'board'
  | 'name'
  | 'pos'
  | 'team'
  | RotoKey
  | 'rotoPts'
  | 'adp'
  | 'drafted'

type Props = {
  playersById: Map<number, Player>
  order: number[]
  poolIds: number[]
  excludeDraftedFromPool: boolean
  setExcludeDraftedFromPool: (v: boolean) => void
  draftedMap: Record<number, boolean>
  toggleDrafted: (id: number) => void
  onOpenPlayer: (id: number) => void
  search: string
  onSearchChange: (v: string) => void
  teamFilter: string
  onTeamFilterChange: (v: string) => void
  leagueFilter: PlayerFilterState['league']
  onLeagueFilterChange: (v: PlayerFilterState['league']) => void
  teams: string[]
  positionTab: string
  onPositionTabChange: (id: string) => void
  availFilter: PlayerAvailFilter
  onAvailFilterChange: (v: PlayerAvailFilter) => void
  highlightPlayerId?: number | null
}

function formatBigBoardRotoCell(p: Player, key: RotoKey): string {
  const pt = getPlayerType(p.pos, p.name)
  if (!showsRotoCategory(pt, key)) return '—'
  switch (key) {
    case 'obp':
      return p.roto.obp.toFixed(3)
    case 'slg':
      return p.roto.slg.toFixed(3)
    case 'hr':
      return String(p.roto.hr)
    case 'netSb':
      return String(p.roto.netSb)
    case 'kbbPct':
      return getRotoValue(p, key).toFixed(1)
    case 'whip':
      return p.roto.whip.toFixed(2)
    case 'era':
      return p.roto.era.toFixed(2)
    case 'svH':
      return String(p.roto.svH)
    default:
      return '—'
  }
}

export function BigBoard({
  playersById,
  order,
  poolIds,
  excludeDraftedFromPool,
  setExcludeDraftedFromPool,
  draftedMap,
  toggleDrafted,
  onOpenPlayer,
  search,
  onSearchChange,
  teamFilter,
  onTeamFilterChange,
  leagueFilter,
  onLeagueFilterChange,
  teams,
  positionTab,
  onPositionTabChange,
  availFilter,
  onAvailFilterChange,
  highlightPlayerId,
}: Props) {
  const roto = useRotoRankings(playersById, poolIds)
  const [sortCol, setSortCol] = useState<SortColumn | null>(null)
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')
  const tableScrollRef = useRef<HTMLDivElement>(null)

  const playerFilters = useMemo<PlayerFilterState>(
    () => ({
      search,
      team: teamFilter,
      league: leagueFilter,
      positionTab,
      status: availFilter,
    }),
    [search, teamFilter, leagueFilter, positionTab, availFilter]
  )

  const filteredOrderedIds = useFilteredPlayerIds(order, playersById, draftedMap, playerFilters)

  useEffect(() => {
    if (!highlightPlayerId) return
    const el = document.querySelector(`[data-board-player-id="${highlightPlayerId}"]`)
    el?.scrollIntoView({ block: 'center', behavior: 'smooth' })
  }, [highlightPlayerId])

  const displayIds = useMemo(() => {
    if (!sortCol || sortCol === 'board') return filteredOrderedIds
    const ids = [...filteredOrderedIds]
    const dir = sortDir === 'asc' ? 1 : -1
    const get = (id: number): string | number => {
      const p = playersById.get(id)!
      const rb = roto.get(id)
      switch (sortCol) {
        case 'name':
          return p.name
        case 'pos':
          return p.pos
        case 'team':
          return p.team
        case 'rotoPts':
          return rb?.totalPoints ?? 0
        case 'adp':
          return p.adp
        case 'drafted':
          return draftedMap[id] ? 1 : 0
        default:
          if (ROTO_KEYS.includes(sortCol as RotoKey)) {
            return getRotoValue(p, sortCol as RotoKey)
          }
          return 0
      }
    }
    ids.sort((a, b) => {
      const va = get(a)
      const vb = get(b)
      if (typeof va === 'string' && typeof vb === 'string') {
        return va.localeCompare(vb) * dir
      }
      return ((va as number) - (vb as number)) * dir
    })
    return ids
  }, [filteredOrderedIds, sortCol, sortDir, playersById, roto, draftedMap])

  const rowVirtualizer = useVirtualizer({
    count: displayIds.length,
    getScrollElement: () => tableScrollRef.current,
    estimateSize: () => 44,
    overscan: 14,
  })

  const toggleSort = useCallback(
    (col: SortColumn) => {
      if (col === 'board') {
        setSortCol(null)
        return
      }
      if (sortCol !== col) {
        setSortCol(col)
        setSortDir(col === 'name' || col === 'pos' || col === 'team' ? 'asc' : 'desc')
        return
      }
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    },
    [sortCol]
  )

  const sortActive = (col: SortColumn) =>
    col === 'board' ? sortCol === null || sortCol === 'board' : sortCol === col

  const headerBtn = (label: string, col: SortColumn) => {
    const active = sortActive(col)
    const dir =
      col === 'board'
        ? null
        : sortCol === col
          ? sortDir
          : null
    return (
      <button
        type="button"
        onClick={() => toggleSort(col)}
        className={`flex w-full items-center gap-1 text-left font-medium hover:text-zinc-900 dark:hover:text-zinc-100 ${
          active ? 'text-zinc-900 dark:text-zinc-100' : 'text-zinc-600 dark:text-zinc-400'
        }`}
      >
        {label}
        {dir && <span className="text-[10px]">{dir === 'asc' ? '↑' : '↓'}</span>}
      </button>
    )
  }

  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/40">
      <div className="mb-4 space-y-4">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
            Roto big board
          </h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            4×4-style categories · live roto points · virtualized rows (reorder from the player card)
          </p>
        </div>
        <FilterBar
          search={search}
          onSearchChange={onSearchChange}
          teamFilter={teamFilter}
          onTeamFilterChange={onTeamFilterChange}
          teams={teams}
          leagueFilter={leagueFilter}
          onLeagueFilterChange={onLeagueFilterChange}
          positionTab={positionTab}
          onPositionTabChange={onPositionTabChange}
        >
          <select
            value={availFilter}
            onChange={(e) => onAvailFilterChange(e.target.value as PlayerAvailFilter)}
            className="rounded-lg border border-zinc-200 bg-white px-2 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-950"
          >
            <option value="all">All players</option>
            <option value="available">Available</option>
            <option value="drafted">Drafted</option>
          </select>
          <label className="flex cursor-pointer items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400">
            <input
              type="checkbox"
              checked={excludeDraftedFromPool}
              onChange={(e) => setExcludeDraftedFromPool(e.target.checked)}
            />
            Exclude drafted from roto pool
          </label>
        </FilterBar>
      </div>

      <div className="overflow-x-auto">
        <div ref={tableScrollRef} className="max-h-[min(70vh,820px)] overflow-auto">
        <table className="w-full min-w-[1100px] table-fixed border-collapse text-sm">
          <thead className="sticky top-0 z-10 bg-white dark:bg-zinc-900">
            <tr className="border-b border-zinc-200 text-left text-xs uppercase tracking-wide text-zinc-500 dark:border-zinc-700 dark:text-zinc-400">
              <th className="pb-2 pr-2">{headerBtn('Rank', 'board')}</th>
              <th className="pb-2 pr-2">{headerBtn('Player', 'name')}</th>
              <th className="pb-2 pr-2">{headerBtn('Pos', 'pos')}</th>
              <th className="pb-2 pr-2">{headerBtn('Team', 'team')}</th>
              <th className="pb-2 pr-2">{headerBtn('OBP', 'obp')}</th>
              <th className="pb-2 pr-2">{headerBtn('SLG', 'slg')}</th>
              <th className="pb-2 pr-2">{headerBtn('HR', 'hr')}</th>
              <th className="pb-2 pr-2">{headerBtn('Net SB', 'netSb')}</th>
              <th className="pb-2 pr-2">{headerBtn('K−BB%', 'kbbPct')}</th>
              <th className="pb-2 pr-2">{headerBtn('WHIP', 'whip')}</th>
              <th className="pb-2 pr-2">{headerBtn('ERA', 'era')}</th>
              <th className="pb-2 pr-2">{headerBtn('Sv+H', 'svH')}</th>
              <th className="pb-2 pr-2">{headerBtn('Roto', 'rotoPts')}</th>
              <th className="pb-2 pr-2">{headerBtn('ADP', 'adp')}</th>
              <th className="pb-2">{headerBtn('Taken', 'drafted')}</th>
            </tr>
          </thead>
          <tbody
            className="relative text-zinc-900 dark:text-zinc-100"
            style={{
              position: 'relative',
              height: displayIds.length ? `${rowVirtualizer.getTotalSize()}px` : undefined,
            }}
          >
            {displayIds.length === 0 && (
              <tr>
                <td colSpan={15} className="py-10 text-center text-sm text-zinc-500">
                  No players match the current filters.
                </td>
              </tr>
            )}
            {rowVirtualizer.getVirtualItems().map((virtualRow) => {
              const idx = virtualRow.index
              const id = displayIds[idx]
              const p = playersById.get(id)!
              const rb = roto.get(id)
              const boardRank = idx + 1
              const d = draftedMap[id] ?? p.drafted
              const reach = boardRank < p.adp
              const value = boardRank > p.adp
              return (
                <tr
                  key={virtualRow.key}
                  data-board-player-id={id}
                  data-index={virtualRow.index}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    transform: `translateY(${virtualRow.start}px)`,
                  }}
                  onClick={() => onOpenPlayer(id)}
                  className={`cursor-pointer border-b border-zinc-100 transition-colors hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-800/50 ${
                    d ? 'opacity-50 line-through' : ''
                  } ${highlightPlayerId === id ? 'ring-2 ring-blue-500 ring-inset dark:ring-blue-400' : ''}`}
                >
                  <td className="py-2 pr-2 font-mono text-zinc-500">{boardRank}</td>
                  <td className="py-2 pr-2 font-medium text-zinc-900 dark:text-zinc-100">{p.name}</td>
                  <td className="py-2 pr-2">
                    <PositionPill pos={p.pos} />
                  </td>
                  <td className="py-2 pr-2 text-zinc-600 dark:text-zinc-400">{p.team}</td>
                  <td className="py-2 pr-2 font-mono tabular-nums">{formatBigBoardRotoCell(p, 'obp')}</td>
                  <td className="py-2 pr-2 font-mono tabular-nums">{formatBigBoardRotoCell(p, 'slg')}</td>
                  <td className="py-2 pr-2 font-mono tabular-nums">{formatBigBoardRotoCell(p, 'hr')}</td>
                  <td className="py-2 pr-2 font-mono tabular-nums">{formatBigBoardRotoCell(p, 'netSb')}</td>
                  <td className="py-2 pr-2 font-mono tabular-nums">{formatBigBoardRotoCell(p, 'kbbPct')}</td>
                  <td className="py-2 pr-2 font-mono tabular-nums">{formatBigBoardRotoCell(p, 'whip')}</td>
                  <td className="py-2 pr-2 font-mono tabular-nums">{formatBigBoardRotoCell(p, 'era')}</td>
                  <td className="py-2 pr-2 font-mono tabular-nums">{formatBigBoardRotoCell(p, 'svH')}</td>
                  <td className="py-2 pr-2 font-mono tabular-nums text-blue-600 dark:text-blue-400">
                    {rb ? rb.totalPoints.toFixed(1) : '—'}
                  </td>
                  <td className="py-2 pr-2">
                    <span className="font-mono tabular-nums">{p.adp.toFixed(1)}</span>
                    <span
                      className={`ml-2 text-xs font-medium ${
                        value ? 'text-emerald-600 dark:text-emerald-400' : reach ? 'text-rose-600 dark:text-rose-400' : 'text-zinc-400'
                      }`}
                    >
                      {value ? 'value' : reach ? 'reach' : '—'}
                    </span>
                  </td>
                  <td className="py-2">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        toggleDrafted(id)
                      }}
                      className="rounded border border-zinc-200 px-2 py-0.5 text-xs dark:border-zinc-600"
                    >
                      {d ? 'Undo' : 'Drafted'}
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
        </div>
      </div>
    </div>
  )
}
