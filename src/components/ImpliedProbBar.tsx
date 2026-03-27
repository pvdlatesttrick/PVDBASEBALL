import type { GameOdds } from '@/types/odds'

function fmtPct(p: number): string {
  return `${(p * 100).toFixed(1)}%`
}

export function ImpliedProbBar({ game }: { game: GameOdds }) {
  const { awayAbbr, homeAbbr, impliedAway, impliedHome } = game
  return (
    <div className="space-y-2">
      <p className="text-xs font-medium uppercase text-zinc-500">Implied win % (vig-adjusted)</p>
      <div className="flex h-8 overflow-hidden rounded-lg bg-zinc-200 dark:bg-zinc-700">
        <div
          className="flex items-center justify-center bg-blue-600 text-xs font-semibold text-white dark:bg-blue-500"
          style={{ width: `${impliedAway * 100}%` }}
        >
          {impliedAway >= 0.12 ? `${awayAbbr} ${fmtPct(impliedAway)}` : ''}
        </div>
        <div
          className="flex items-center justify-center bg-emerald-600 text-xs font-semibold text-white dark:bg-emerald-500"
          style={{ width: `${impliedHome * 100}%` }}
        >
          {impliedHome >= 0.12 ? `${homeAbbr} ${fmtPct(impliedHome)}` : ''}
        </div>
      </div>
      <div className="flex justify-between text-xs text-zinc-600 dark:text-zinc-400">
        <span>
          {awayAbbr} {fmtPct(impliedAway)}
        </span>
        <span>
          {homeAbbr} {fmtPct(impliedHome)}
        </span>
      </div>
    </div>
  )
}
