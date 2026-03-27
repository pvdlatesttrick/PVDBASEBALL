import type { GameOdds, BookLineRow } from '@/types/odds'

function fmtAmerican(n: number | null): string {
  if (n == null) return '—'
  return n > 0 ? `+${n}` : String(n)
}

function fmtSpread(pt: number | null, price: number | null): string {
  if (pt == null || price == null) return '—'
  const sign = pt > 0 ? '+' : ''
  return `${sign}${pt} (${fmtAmerican(price)})`
}

function cellClass(isBest: boolean): string {
  return isBest
    ? 'bg-emerald-100 font-semibold text-emerald-900 dark:bg-emerald-950/60 dark:text-emerald-200'
    : ''
}

function rowHighlights(game: GameOdds, r: BookLineRow) {
  const { bestAwayMl, bestHomeMl, bestAwaySpread, bestHomeSpread, bestOver, bestUnder } = game
  return {
    awayMl:
      r.awayMl != null &&
      bestAwayMl != null &&
      r.bookKey === bestAwayMl.bookKey &&
      r.awayMl === bestAwayMl.price,
    homeMl:
      r.homeMl != null &&
      bestHomeMl != null &&
      r.bookKey === bestHomeMl.bookKey &&
      r.homeMl === bestHomeMl.price,
    awaySp:
      r.awaySpreadPts != null &&
      r.awaySpreadPrice != null &&
      bestAwaySpread != null &&
      r.bookKey === bestAwaySpread.bookKey &&
      r.awaySpreadPts === bestAwaySpread.point &&
      r.awaySpreadPrice === bestAwaySpread.price,
    homeSp:
      r.homeSpreadPts != null &&
      r.homeSpreadPrice != null &&
      bestHomeSpread != null &&
      r.bookKey === bestHomeSpread.bookKey &&
      r.homeSpreadPts === bestHomeSpread.point &&
      r.homeSpreadPrice === bestHomeSpread.price,
    over:
      r.overPrice != null &&
      r.totalPts != null &&
      bestOver != null &&
      r.bookKey === bestOver.bookKey &&
      r.totalPts === bestOver.point &&
      r.overPrice === bestOver.price,
    under:
      r.underPrice != null &&
      r.totalPts != null &&
      bestUnder != null &&
      r.bookKey === bestUnder.bookKey &&
      r.totalPts === bestUnder.point &&
      r.underPrice === bestUnder.price,
  }
}

export function OddsTable({ game }: { game: GameOdds }) {
  return (
    <div className="overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-700">
      <table className="w-full min-w-[720px] text-left text-xs">
        <thead>
          <tr className="border-b border-zinc-200 bg-zinc-50 text-zinc-600 dark:border-zinc-700 dark:bg-zinc-800/80 dark:text-zinc-400">
            <th className="px-2 py-2">Book</th>
            <th className="px-2 py-2">{game.awayAbbr} ML</th>
            <th className="px-2 py-2">{game.homeAbbr} ML</th>
            <th className="px-2 py-2">{game.awayAbbr} RL</th>
            <th className="px-2 py-2">{game.homeAbbr} RL</th>
            <th className="px-2 py-2">Total</th>
            <th className="px-2 py-2">Over</th>
            <th className="px-2 py-2">Under</th>
          </tr>
        </thead>
        <tbody>
          {game.bookRows.map((r) => {
            const h = rowHighlights(game, r)
            return (
              <tr key={r.bookKey} className="border-b border-zinc-100 dark:border-zinc-800">
                <td className="px-2 py-1.5 font-medium text-zinc-800 dark:text-zinc-200">{r.bookTitle}</td>
                <td className={`px-2 py-1.5 font-mono tabular-nums ${cellClass(h.awayMl)}`}>
                  {fmtAmerican(r.awayMl)}
                </td>
                <td className={`px-2 py-1.5 font-mono tabular-nums ${cellClass(h.homeMl)}`}>
                  {fmtAmerican(r.homeMl)}
                </td>
                <td className={`px-2 py-1.5 font-mono tabular-nums ${cellClass(h.awaySp)}`}>
                  {fmtSpread(r.awaySpreadPts, r.awaySpreadPrice)}
                </td>
                <td className={`px-2 py-1.5 font-mono tabular-nums ${cellClass(h.homeSp)}`}>
                  {fmtSpread(r.homeSpreadPts, r.homeSpreadPrice)}
                </td>
                <td className="px-2 py-1.5 font-mono tabular-nums text-zinc-600 dark:text-zinc-400">
                  {r.totalPts ?? '—'}
                </td>
                <td className={`px-2 py-1.5 font-mono tabular-nums ${cellClass(h.over)}`}>
                  {r.overPrice != null && r.totalPts != null ? `${r.totalPts} ${fmtAmerican(r.overPrice)}` : '—'}
                </td>
                <td className={`px-2 py-1.5 font-mono tabular-nums ${cellClass(h.under)}`}>
                  {r.underPrice != null && r.totalPts != null ? `${r.totalPts} ${fmtAmerican(r.underPrice)}` : '—'}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
      <p className="border-t border-zinc-200 px-2 py-1.5 text-[10px] text-zinc-500 dark:border-zinc-700">
        Best available price per column highlighted (lowest implied juice).
      </p>
    </div>
  )
}
