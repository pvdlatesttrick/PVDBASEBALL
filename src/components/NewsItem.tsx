import type { NewsItem } from '@/types/news'
import type { Player } from '@/types/player'
import { findPlayerIdByName } from '@/utils/playerLookup'

function timeAgo(d: Date): string {
  const s = Math.floor((Date.now() - d.getTime()) / 1000)
  if (s < 60) return 'just now'
  if (s < 3600) return `${Math.floor(s / 60)}m ago`
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`
  if (s < 604800) return `${Math.floor(s / 86400)}d ago`
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
}

const IMPACT: Record<NewsItem['impact'], { dot: string; label: string }> = {
  high: { dot: '#ef4444', label: 'HIGH' },
  medium: { dot: '#f59e0b', label: 'MED' },
  low: { dot: '#94a3b8', label: 'LOW' },
}

const CAT_CLASS: Record<NewsItem['category'], string> = {
  injury: 'bg-rose-100 text-rose-800 dark:bg-rose-950/80 dark:text-rose-200',
  transaction: 'bg-violet-100 text-violet-800 dark:bg-violet-950/80 dark:text-violet-200',
  news: 'bg-sky-100 text-sky-800 dark:bg-sky-950/80 dark:text-sky-200',
  prospect: 'bg-amber-100 text-amber-900 dark:bg-amber-950/80 dark:text-amber-200',
  roster: 'bg-zinc-200 text-zinc-800 dark:bg-zinc-700 dark:text-zinc-100',
}

const CAT_LABEL: Record<NewsItem['category'], string> = {
  injury: 'Injury',
  transaction: 'Transaction',
  news: 'News',
  prospect: 'Prospect',
  roster: 'Roster',
}

type Props = {
  item: NewsItem
  playersById: Map<number, Player>
  onMarkRead: (id: string) => void
  onViewOnBoard?: (playerId: number) => void
  onClosePanel?: () => void
}

export function NewsItemCard({ item, playersById, onMarkRead, onViewOnBoard, onClosePanel }: Props) {
  const pid = item.playerName ? findPlayerIdByName(playersById, item.playerName) : undefined
  const imp = IMPACT[item.impact]

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onMarkRead(item.id)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onMarkRead(item.id)
        }
      }}
      className={`rounded-xl border p-3 text-left text-sm transition-colors ${
        item.isRead
          ? 'border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-900/40'
          : 'border-blue-200/80 bg-blue-50/50 dark:border-blue-900/50 dark:bg-blue-950/25'
      }`}
    >
      <div className="flex flex-wrap items-center gap-2 text-[11px]">
        <span className="flex items-center gap-1 font-semibold uppercase tracking-wide text-zinc-600 dark:text-zinc-400">
          <span className="h-2 w-2 rounded-full" style={{ background: imp.dot }} title={imp.label} />
          {imp.label}
        </span>
        <span className={`rounded-full px-2 py-0.5 font-medium ${CAT_CLASS[item.category]}`}>
          {CAT_LABEL[item.category]}
        </span>
        <span className="text-zinc-500">{item.source}</span>
        <span className="ml-auto text-zinc-400">{timeAgo(item.publishedAt)}</span>
      </div>
      <p className="mt-2 font-medium text-zinc-900 dark:text-zinc-50">{item.headline}</p>
      {item.summary && item.summary !== item.headline && (
        <p className="mt-1 text-xs leading-relaxed text-zinc-600 dark:text-zinc-400">{item.summary}</p>
      )}
      <div className="mt-3 flex flex-wrap gap-2">
        {pid !== undefined && onViewOnBoard && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              onMarkRead(item.id)
              onClosePanel?.()
              onViewOnBoard(pid)
            }}
            className="rounded-lg border border-blue-600 bg-blue-600 px-2 py-1 text-xs font-medium text-white hover:bg-blue-700 dark:border-blue-500 dark:bg-blue-600"
          >
            View on board ↗
          </button>
        )}
        {item.url && item.url !== '#' && (
          <a
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="rounded-lg border border-zinc-300 px-2 py-1 text-xs font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-600 dark:text-zinc-200 dark:hover:bg-zinc-800"
          >
            Full article →
          </a>
        )}
      </div>
    </div>
  )
}
