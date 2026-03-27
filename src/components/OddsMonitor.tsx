import { useOdds } from '@/context/OddsContext'

const QUOTA_LIMIT = 500

function quotaColor(used: number): string {
  if (used >= 470) return 'text-rose-600 dark:text-rose-400'
  if (used >= 400) return 'text-amber-600 dark:text-amber-400'
  return 'text-zinc-600 dark:text-zinc-400'
}

function barColor(used: number): string {
  if (used >= 470) return 'bg-rose-500'
  if (used >= 400) return 'bg-amber-500'
  return 'bg-emerald-500'
}

export function OddsMonitor() {
  const { requestsUsed, requestsRemaining, loading, source, refresh, lastFetchedAt, error } = useOdds()

  const used = requestsUsed ?? 0
  const pct = Math.min(100, (used / QUOTA_LIMIT) * 100)

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-sm rounded-xl border border-zinc-200 bg-white p-3 text-sm shadow-lg dark:border-zinc-700 dark:bg-zinc-900">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-semibold text-zinc-900 dark:text-zinc-50">Odds API</p>
          <p className={`text-xs font-mono tabular-nums ${quotaColor(used)}`}>
            Requests used: {requestsUsed ?? '—'} / {QUOTA_LIMIT}
            {requestsRemaining != null && (
              <span className="ml-2 text-zinc-500">({requestsRemaining} left)</span>
            )}
          </p>
          <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-700">
            <div className={`h-1.5 rounded-full ${barColor(used)}`} style={{ width: `${pct}%` }} />
          </div>
          <p className="mt-1 text-[10px] text-zinc-500">
            Source: {source === 'live' ? 'live' : 'mock'}
            {loading ? ' · loading…' : ''}
            {lastFetchedAt != null && ` · ${new Date(lastFetchedAt).toLocaleTimeString()}`}
          </p>
          {error && <p className="mt-1 text-[10px] text-rose-600 dark:text-rose-400">{error}</p>}
        </div>
        <button
          type="button"
          onClick={() => refresh()}
          className="shrink-0 rounded-lg border border-zinc-300 bg-zinc-50 px-2 py-1 text-xs font-medium hover:bg-zinc-100 dark:border-zinc-600 dark:bg-zinc-800 dark:hover:bg-zinc-700"
        >
          Refresh
        </button>
      </div>
      <p className="mt-2 border-t border-zinc-100 pt-2 text-[10px] leading-snug text-zinc-500 dark:border-zinc-800">
        For entertainment and fantasy purposes only.
      </p>
    </div>
  )
}
