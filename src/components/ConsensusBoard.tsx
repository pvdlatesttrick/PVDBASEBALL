import { useCallback, useMemo, useRef, useState } from 'react'
import { useVirtualizer } from '@tanstack/react-virtual'
import type { Player } from '@/types/player'
import type { ConsensusPlayer } from '@/types/consensus'
import { CONSENSUS_RANKINGS } from '@/data/consensusRankings'
import { TIER_LABELS } from '@/data/tierLabels'
import { FilterBar } from '@/components/FilterBar'
import { PositionPill } from '@/components/PositionPill'
import { findPlayerIdByName } from '@/utils/playerLookup'
import type { RotoBreakdown } from '@/hooks/useRotoRankings'
import {
  useFilteredConsensusPlayers,
  type PlayerAvailFilter,
  type PlayerFilterState,
} from '@/hooks/useFilteredPlayers'

type SortKey =
  | 'consensusRank'
  | 'name'
  | 'pos'
  | 'team'
  | 'posRank'
  | 'espnRank'
  | 'yahooRank'
  | 'fangraphsRank'
  | 'rotoballerRank'
  | 'avgRank'
  | 'stdDev'
  | 'adp'

type Props = {
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
  playersById: Map<number, Player>
  order: number[]
  draftedMap: Record<number, boolean>
  toggleDrafted: (id: number) => void
  rotoMap: Map<number, RotoBreakdown>
  onViewOnBoard: (playerId: number) => void
}

function stdDevClass(v: number): string {
  if (v < 5) return 'text-emerald-600 dark:text-emerald-400'
  if (v <= 15) return 'text-amber-600 dark:text-amber-400'
  return 'text-rose-600 dark:text-rose-400'
}

function TrendCell({ t }: { t: ConsensusPlayer['trend'] }) {
  if (t === 'up') return <span className="text-emerald-600">▲</span>
  if (t === 'down') return <span className="text-rose-600">▼</span>
  return <span className="text-zinc-400">—</span>
}

export function ConsensusBoard({
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
  playersById,
  order,
  draftedMap,
  toggleDrafted,
  rotoMap,
  onViewOnBoard,
}: Props) {
  const [sortKey, setSortKey] = useState<SortKey>('consensusRank')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')

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

  const filtered = useFilteredConsensusPlayers(
    CONSENSUS_RANKINGS,
    playersById,
    draftedMap,
    playerFilters
  )

  const sorted = useMemo(() => {
    const rows = [...filtered]
    const dir = sortDir === 'asc' ? 1 : -1
    rows.sort((a, b) => {
      const va = a[sortKey]
      const vb = b[sortKey]
      if (typeof va === 'string' && typeof vb === 'string') {
        return va.localeCompare(vb) * dir
      }
      return ((va as number) - (vb as number)) * dir
    })
    return rows
  }, [filtered, sortKey, sortDir])

  const toggleSort = useCallback(
    (key: SortKey) => {
      if (sortKey !== key) {
        setSortKey(key)
        setSortDir(key === 'name' || key === 'pos' || key === 'team' || key === 'posRank' ? 'asc' : 'asc')
        return
      }
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    },
    [sortKey]
  )

  const rowsWithDividers = useMemo(() => {
    type Row = { kind: 'tier'; tier: number } | { kind: 'player'; p: ConsensusPlayer }
    const out: Row[] = []
    let prevTier = 0
    for (const p of sorted) {
      if (p.tier !== prevTier) {
        out.push({ kind: 'tier', tier: p.tier })
        prevTier = p.tier
      }
      out.push({ kind: 'player', p })
    }
    return out
  }, [sorted])

  const tableScrollRef = useRef<HTMLDivElement>(null)

  const rowVirtualizer = useVirtualizer({
    count: rowsWithDividers.length,
    getScrollElement: () => tableScrollRef.current,
    estimateSize: (i) => (rowsWithDividers[i]?.kind === 'tier' ? 32 : 44),
    overscan: 12,
  })

  const header = (label: string, key: SortKey) => (
    <button
      type="button"
      onClick={() => toggleSort(key)}
      className="flex w-full items-center gap-1 text-left font-medium hover:text-zinc-900 dark:hover:text-zinc-100"
    >
      {label}
      {sortKey === key && <span className="text-[10px]">{sortDir === 'asc' ? '↑' : '↓'}</span>}
    </button>
  )

  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/40">
      <div className="mb-4">
        <h1 className="text-xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          Fantasy consensus big board
        </h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          2025 preseason composite · ESPN, Yahoo, FanGraphs, Rotoballer
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
      </FilterBar>

      <div className="mt-4 overflow-x-auto">
        <div ref={tableScrollRef} className="max-h-[min(70vh,820px)] overflow-auto">
        <table className="w-full min-w-[1200px] table-fixed border-collapse text-sm">
          <thead className="sticky top-0 z-10 bg-white dark:bg-zinc-900">
            <tr className="border-b border-zinc-200 text-left text-xs uppercase tracking-wide text-zinc-500 dark:border-zinc-700 dark:text-zinc-400">
              <th className="pb-2 pr-2">{header('Rank', 'consensusRank')}</th>
              <th className="pb-2 pr-2">{header('Player', 'name')}</th>
              <th className="pb-2 pr-2">{header('Pos', 'pos')}</th>
              <th className="pb-2 pr-2">{header('Team', 'team')}</th>
              <th className="pb-2 pr-2">{header('Pos rank', 'posRank')}</th>
              <th className="pb-2 pr-2">{header('ESPN', 'espnRank')}</th>
              <th className="pb-2 pr-2">{header('Yahoo', 'yahooRank')}</th>
              <th className="pb-2 pr-2">{header('FG', 'fangraphsRank')}</th>
              <th className="pb-2 pr-2">{header('Roto', 'rotoballerRank')}</th>
              <th className="pb-2 pr-2">{header('Avg', 'avgRank')}</th>
              <th className="pb-2 pr-2">{header('StdDev', 'stdDev')}</th>
              <th className="pb-2 pr-2">{header('ADP', 'adp')}</th>
              <th className="pb-2 pr-2">Trend</th>
              <th className="pb-2 pr-2">vs board</th>
              <th className="pb-2 pr-2">Roto pts</th>
              <th className="pb-2"> </th>
            </tr>
          </thead>
          <tbody
            className="relative"
            style={{
              position: 'relative',
              height: rowsWithDividers.length ? `${rowVirtualizer.getTotalSize()}px` : undefined,
            }}
          >
            {sorted.length === 0 && (
              <tr>
                <td colSpan={16} className="py-10 text-center text-sm text-zinc-500">
                  No players match the current filters.
                </td>
              </tr>
            )}
            {rowVirtualizer.getVirtualItems().map((virtualRow) => {
              const row = rowsWithDividers[virtualRow.index]
              if (row.kind === 'tier') {
                return (
                  <tr
                    key={virtualRow.key}
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      transform: `translateY(${virtualRow.start}px)`,
                    }}
                    className="bg-zinc-100 dark:bg-zinc-800/80"
                  >
                    <td
                      colSpan={16}
                      className="py-2 pl-2 text-xs font-semibold uppercase tracking-wide text-zinc-600 dark:text-zinc-300"
                    >
                      {TIER_LABELS[row.tier] ?? `Tier ${row.tier}`}
                    </td>
                  </tr>
                )
              }
              const p = row.p
              const pid = findPlayerIdByName(playersById, p.name)
              const drafted = pid !== undefined ? draftedMap[pid] ?? false : false
              const boardRank = pid !== undefined ? order.indexOf(pid) : -1
              const br = boardRank >= 0 ? boardRank + 1 : null
              const diff = br !== null ? p.consensusRank - br : null
              const rb = pid !== undefined ? rotoMap.get(pid) : undefined

              return (
                <tr
                  key={virtualRow.key}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    transform: `translateY(${virtualRow.start}px)`,
                  }}
                  className={`border-b border-zinc-100 dark:border-zinc-800 ${
                    drafted ? 'opacity-50 line-through' : ''
                  }`}
                >
                  <td className="py-2 pr-2 font-mono tabular-nums text-zinc-600">{p.consensusRank}</td>
                  <td className="py-2 pr-2 font-medium text-zinc-900 dark:text-zinc-100" title={p.notes}>
                    {p.name}
                  </td>
                  <td className="py-2 pr-2">
                    <PositionPill pos={p.pos} />
                  </td>
                  <td className="py-2 pr-2 text-zinc-600">{p.team}</td>
                  <td className="py-2 pr-2 font-mono text-xs">{p.posRank}</td>
                  <td className="py-2 pr-2 font-mono tabular-nums">{p.espnRank}</td>
                  <td className="py-2 pr-2 font-mono tabular-nums">{p.yahooRank}</td>
                  <td className="py-2 pr-2 font-mono tabular-nums">{p.fangraphsRank}</td>
                  <td className="py-2 pr-2 font-mono tabular-nums">{p.rotoballerRank}</td>
                  <td className="py-2 pr-2 font-mono tabular-nums">{p.avgRank.toFixed(1)}</td>
                  <td className={`py-2 pr-2 font-mono tabular-nums ${stdDevClass(p.stdDev)}`}>
                    {p.stdDev.toFixed(1)}
                  </td>
                  <td className="py-2 pr-2 font-mono tabular-nums">{p.adp.toFixed(1)}</td>
                  <td className="py-2 pr-2 text-center">
                    <TrendCell t={p.trend} />
                  </td>
                  <td className="py-2 pr-2">
                    {diff === null ? (
                      <span className="text-zinc-400">—</span>
                    ) : (
                      <span
                        className={`inline-flex min-w-[2rem] justify-center rounded-full px-1.5 py-0.5 text-xs font-medium ${
                          diff > 0
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                            : diff < 0
                              ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300'
                              : 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400'
                        }`}
                      >
                        {diff > 0 ? `+${diff}` : diff}
                      </span>
                    )}
                  </td>
                  <td className="py-2 pr-2 font-mono tabular-nums text-blue-600 dark:text-blue-400">
                    {rb ? rb.totalPoints.toFixed(1) : '—'}
                  </td>
                  <td className="py-2">
                    {pid !== undefined ? (
                      <div className="flex flex-wrap gap-1">
                        <button
                          type="button"
                          onClick={() => onViewOnBoard(pid)}
                          className="rounded border border-zinc-200 px-2 py-0.5 text-xs dark:border-zinc-600"
                        >
                          View on board
                        </button>
                        <button
                          type="button"
                          onClick={() => toggleDrafted(pid)}
                          className="rounded border border-zinc-200 px-2 py-0.5 text-xs dark:border-zinc-600"
                        >
                          {drafted ? 'Undo' : 'Drafted'}
                        </button>
                      </div>
                    ) : (
                      <span className="text-xs text-zinc-400">—</span>
                    )}
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
