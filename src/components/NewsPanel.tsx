import { useEffect, useMemo, useState } from 'react'
import type { Player } from '@/types/player'
import { useNews } from '@/context/NewsContext'
import { NewsItemCard } from '@/components/NewsItem'

type Tab = 'all' | 'injury' | 'transaction' | 'prospect' | 'news'

const TABS: { id: Tab; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'injury', label: 'Injuries' },
  { id: 'transaction', label: 'Transactions' },
  { id: 'prospect', label: 'Prospects' },
  { id: 'news', label: 'News' },
]

function formatUpdated(d: Date | null): string {
  if (!d) return '—'
  const m = Math.floor((Date.now() - d.getTime()) / 60000)
  if (m < 1) return 'just now'
  if (m < 60) return `${m} min ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  return d.toLocaleString()
}

type Props = {
  onClose: () => void
  boardTeamFilter: string
  teams: string[]
  playersById: Map<number, Player>
  onViewPlayerOnBoard: (playerId: number) => void
}

export function NewsPanel({ onClose, boardTeamFilter, teams, playersById, onViewPlayerOnBoard }: Props) {
  const { items, loading, error, lastFetched, markRead, markAllRead, refresh, filterByCategory } = useNews()
  const [tab, setTab] = useState<Tab>('all')
  const [teamFilter, setTeamFilter] = useState<string>('all')

  useEffect(() => {
    setTeamFilter(boardTeamFilter === 'all' ? 'all' : boardTeamFilter)
  }, [boardTeamFilter])

  const byTab = useMemo(() => {
    let list = tab === 'all' ? items : filterByCategory(tab)
    if (teamFilter !== 'all') {
      list = list.filter((i) => i.team === teamFilter)
    }
    return list
  }, [items, tab, teamFilter, filterByCategory])

  const sources = useMemo(() => {
    const s = new Set<string>()
    for (const i of items) s.add(i.source)
    return [...s].sort().join(', ')
  }, [items])

  return (
    <div className="w-full overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-lg dark:border-zinc-700 dark:bg-zinc-900">
      <div className="flex flex-wrap items-center gap-2 border-b border-zinc-200 px-3 py-2 dark:border-zinc-700">
        <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">MLB News</span>
        <span className="text-xs text-zinc-500">· Updated {formatUpdated(lastFetched)}</span>
        <button
          type="button"
          onClick={markAllRead}
          className="ml-auto rounded-lg border border-zinc-200 px-2 py-1 text-xs font-medium hover:bg-zinc-50 dark:border-zinc-600 dark:hover:bg-zinc-800"
        >
          Mark all read
        </button>
        <button
          type="button"
          onClick={() => refresh()}
          className="rounded-lg border border-zinc-200 px-2 py-1 text-xs font-medium hover:bg-zinc-50 dark:border-zinc-600 dark:hover:bg-zinc-800"
        >
          ↻ Refresh
        </button>
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg border border-zinc-200 px-2 py-1 text-xs font-medium hover:bg-zinc-50 dark:border-zinc-600 dark:hover:bg-zinc-800"
          aria-label="Close"
        >
          ✕
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-2 border-b border-zinc-100 px-3 py-2 dark:border-zinc-800">
        <span className="text-xs text-zinc-500">Team</span>
        <select
          value={teamFilter}
          onChange={(e) => setTeamFilter(e.target.value)}
          className="rounded-lg border border-zinc-200 bg-white px-2 py-1 text-xs dark:border-zinc-600 dark:bg-zinc-950"
        >
          <option value="all">All teams</option>
          {teams.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
        <div className="ml-auto flex flex-wrap gap-1">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`rounded-full border px-2.5 py-1 text-xs font-medium ${
                tab === t.id
                  ? 'border-blue-600 bg-blue-600 text-white dark:border-blue-500 dark:bg-blue-600'
                  : 'border-zinc-200 bg-white text-zinc-700 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="max-h-[min(70vh,520px)] space-y-2 overflow-y-auto p-3">
        {loading && items.length === 0 && <p className="text-sm text-zinc-500">Loading news…</p>}
        {error && <p className="text-sm text-rose-600">{error}</p>}
        {!loading && byTab.length === 0 && <p className="text-sm text-zinc-500">No items for this filter.</p>}
        {byTab.map((item) => (
          <NewsItemCard
            key={item.id}
            item={item}
            playersById={playersById}
            onMarkRead={markRead}
            onViewOnBoard={onViewPlayerOnBoard}
            onClosePanel={onClose}
          />
        ))}
      </div>

      <div className="border-t border-zinc-200 px-3 py-2 text-[11px] text-zinc-500 dark:border-zinc-700 dark:text-zinc-400">
        Showing {byTab.length} items · Sources: {sources || '—'}
      </div>
    </div>
  )
}
