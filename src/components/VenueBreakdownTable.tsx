import type { VenueBreakdown } from '@/utils/recordTracker'

type Props = {
  rows: VenueBreakdown[]
}

function biasClass(bias: number): string {
  if (Math.abs(bias) > 0.5) return 'text-rose-600 dark:text-rose-400 font-medium'
  return 'text-zinc-800 dark:text-zinc-200'
}

export function VenueBreakdownTable({ rows }: Props) {
  return (
    <div className="overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-700">
      <table className="w-full min-w-[720px] text-left text-sm">
        <thead className="bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
          <tr>
            <th className="px-3 py-2 font-medium">Venue</th>
            <th className="px-3 py-2 font-medium">Team</th>
            <th className="px-3 py-2 font-medium">Games</th>
            <th className="px-3 py-2 font-medium">W</th>
            <th className="px-3 py-2 font-medium">L</th>
            <th className="px-3 py-2 font-medium">Win%</th>
            <th className="px-3 py-2 font-medium">Avg Pred</th>
            <th className="px-3 py-2 font-medium">Avg Actual</th>
            <th className="px-3 py-2 font-medium">Bias</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.venue} className="border-t border-zinc-200 dark:border-zinc-700">
              <td className="px-3 py-2 font-medium text-zinc-900 dark:text-zinc-100">{r.venue}</td>
              <td className="px-3 py-2">{r.team}</td>
              <td className="px-3 py-2 tabular-nums">{r.gamesPlayed}</td>
              <td className="px-3 py-2 tabular-nums">{r.wins}</td>
              <td className="px-3 py-2 tabular-nums">{r.losses}</td>
              <td className="px-3 py-2 tabular-nums">{r.winPct.toFixed(1)}%</td>
              <td className="px-3 py-2 tabular-nums">{r.avgPredictedTotal.toFixed(1)}</td>
              <td className="px-3 py-2 tabular-nums">{r.avgActualTotal.toFixed(1)}</td>
              <td className={`px-3 py-2 tabular-nums ${biasClass(r.bias)}`}>
                {r.bias >= 0 ? '+' : ''}
                {r.bias.toFixed(1)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {rows.length === 0 && (
        <p className="p-4 text-sm text-zinc-500">No venue-graded history yet.</p>
      )}
    </div>
  )
}
