import type { RotoKey } from '@/types/player'
import { ROTO_KEYS } from '@/types/player'
import type { CategoryRankInfo } from '@/hooks/useRotoRankings'

const LABELS: Record<RotoKey, string> = {
  obp: 'OBP',
  slg: 'SLG',
  hr: 'HR',
  netSb: 'SB−CS',
  kbbPct: 'K−BB%',
  whip: 'WHIP',
  era: 'ERA',
  svH: 'Sv+H',
}

export function RotoBar({
  byCategory,
}: {
  byCategory: Record<RotoKey, CategoryRankInfo>
}) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {ROTO_KEYS.map((key) => {
        const info = byCategory[key]
        const pct =
          info.poolSize > 0
            ? ((info.poolSize - info.rank + 1) / info.poolSize) * 100
            : 0
        return (
          <div key={key} className="rounded-lg border border-zinc-200 bg-white p-2 dark:border-zinc-700 dark:bg-zinc-900/40">
            <div className="mb-1 flex items-center justify-between text-[10px] font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
              <span>{LABELS[key]}</span>
              <span className="tabular-nums text-zinc-700 dark:text-zinc-300">
                #{Number.isInteger(info.rank) ? info.rank : info.rank.toFixed(1)}/{info.poolSize}
              </span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
              <div
                className="h-full rounded-full bg-blue-500 transition-[width] dark:bg-blue-400"
                style={{ width: `${Math.max(4, Math.min(100, pct))}%` }}
              />
            </div>
          </div>
        )
      })}
    </div>
  )
}
