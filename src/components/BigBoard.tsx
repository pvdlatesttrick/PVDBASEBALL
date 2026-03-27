import { useCallback, useMemo, useState, type DragEvent } from 'react'
import type { Player } from '@/types/player'
import type { RotoKey } from '@/types/player'
import { ROTO_KEYS } from '@/types/player'
import { PositionPill } from '@/components/PositionPill'
import { getRotoValue, useRotoRankings } from '@/hooks/useRotoRankings'

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
  reorderDrag: (fromIndex: number, toIndex: number) => void
  onOpenPlayer: (id: number) => void
}

function posFilterMatch(player: Player, filter: string): boolean {
  if (filter === 'all') return true
  const p = player.pos.toUpperCase()
  if (filter === 'SP') return p.includes('SP')
  if (filter === 'RP') return p.includes('RP')
  if (filter === 'C') return /\bC\b/.test(p) || p.startsWith('C/')
  if (filter === 'IF') return /(1B|2B|3B|SS)/.test(p)
  if (filter === 'OF') return p.includes('OF') || p.includes('DH')
  return true
}

export function BigBoard({
  playersById,
  order,
  poolIds,
  excludeDraftedFromPool,
  setExcludeDraftedFromPool,
  draftedMap,
  toggleDrafted,
  reorderDrag,
  onOpenPlayer,
}: Props) {
  const roto = useRotoRankings(playersById, poolIds)
  const [sortCol, setSortCol] = useState<SortColumn | null>(null)
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')
  const [posFilter, setPosFilter] = useState<string>('all')
  const [availFilter, setAvailFilter] = useState<'all' | 'available' | 'drafted'>('all')
  const [search, setSearch] = useState('')
  const [dragIndex, setDragIndex] = useState<number | null>(null)

  const filteredOrderedIds = useMemo(() => {
    const q = search.trim().toLowerCase()
    return order.filter((id) => {
      const p = playersById.get(id)
      if (!p) return false
      if (q && !p.name.toLowerCase().includes(q)) return false
      if (!posFilterMatch(p, posFilter)) return false
      const d = draftedMap[id] ?? p.drafted
      if (availFilter === 'available' && d) return false
      if (availFilter === 'drafted' && !d) return false
      return true
    })
  }, [order, playersById, search, posFilter, availFilter, draftedMap])

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

  const onDragStart = (index: number) => {
    if (sortCol && sortCol !== 'board') return
    setDragIndex(index)
  }

  const onDragOver = (e: DragEvent) => {
    e.preventDefault()
  }

  const onDrop = (toIndex: number) => {
    if (sortCol && sortCol !== 'board') return
    if (dragIndex === null || dragIndex === toIndex) {
      setDragIndex(null)
      return
    }
    const fromId = displayIds[dragIndex]
    const toId = displayIds[toIndex]
    const fromFull = order.indexOf(fromId)
    const toFull = order.indexOf(toId)
    if (fromFull < 0 || toFull < 0) {
      setDragIndex(null)
      return
    }
    reorderDrag(fromFull, toFull)
    setDragIndex(null)
  }

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
      <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
            Roto big board
          </h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            4×4-style categories · live roto points · drag rows when board sort is active
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <input
            type="search"
            placeholder="Search name…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="min-w-[180px] rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-950"
          />
          <select
            value={posFilter}
            onChange={(e) => setPosFilter(e.target.value)}
            className="rounded-lg border border-zinc-200 bg-white px-2 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-950"
          >
            <option value="all">All positions</option>
            <option value="C">C</option>
            <option value="IF">IF</option>
            <option value="OF">OF / DH</option>
            <option value="SP">SP</option>
            <option value="RP">RP</option>
          </select>
          <select
            value={availFilter}
            onChange={(e) => setAvailFilter(e.target.value as 'all' | 'available' | 'drafted')}
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
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[1100px] border-collapse text-sm">
          <thead>
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
          <tbody>
            {displayIds.map((id, idx) => {
              const p = playersById.get(id)!
              const rb = roto.get(id)
              const boardRank = idx + 1
              const d = draftedMap[id] ?? p.drafted
              const reach = boardRank < p.adp
              const value = boardRank > p.adp
              return (
                <tr
                  key={id}
                  draggable={sortCol === null || sortCol === 'board'}
                  onDragStart={() => onDragStart(idx)}
                  onDragOver={onDragOver}
                  onDrop={() => onDrop(idx)}
                  onClick={() => onOpenPlayer(id)}
                  className={`cursor-pointer border-b border-zinc-100 transition-colors hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-800/50 ${
                    d ? 'opacity-50 line-through' : ''
                  }`}
                >
                  <td className="py-2 pr-2 font-mono text-zinc-500">{boardRank}</td>
                  <td className="py-2 pr-2 font-medium text-zinc-900 dark:text-zinc-100">{p.name}</td>
                  <td className="py-2 pr-2">
                    <PositionPill pos={p.pos} />
                  </td>
                  <td className="py-2 pr-2 text-zinc-600 dark:text-zinc-400">{p.team}</td>
                  <td className="py-2 pr-2 font-mono tabular-nums">{p.roto.obp.toFixed(3)}</td>
                  <td className="py-2 pr-2 font-mono tabular-nums">{p.roto.slg.toFixed(3)}</td>
                  <td className="py-2 pr-2 font-mono tabular-nums">{p.roto.hr}</td>
                  <td className="py-2 pr-2 font-mono tabular-nums">{p.roto.netSb}</td>
                  <td className="py-2 pr-2 font-mono tabular-nums">{getRotoValue(p, 'kbbPct').toFixed(1)}</td>
                  <td className="py-2 pr-2 font-mono tabular-nums">{p.roto.whip.toFixed(2)}</td>
                  <td className="py-2 pr-2 font-mono tabular-nums">{p.roto.era.toFixed(2)}</td>
                  <td className="py-2 pr-2 font-mono tabular-nums">{p.roto.svH}</td>
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
  )
}
