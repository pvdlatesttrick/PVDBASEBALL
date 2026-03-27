import type { TeamBreakdown } from '@/utils/recordTracker'

type Props = {
  rows: TeamBreakdown[]
}

function rowTint(winPct: number): string {
  if (winPct > 65) return 'bg-emerald-50 dark:bg-emerald-950/40'
  if (winPct < 40) return 'bg-rose-50 dark:bg-rose-950/40'
  return ''
}

export function TeamBreakdownTable({ rows }: Props) {
  return (
    <div className="overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-700">
      <table className="w-full min-w-[640px] text-left text-sm">
        <thead className="bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
          <tr>
            <th className="px-3 py-2 font-medium">Team</th>
            <th className="px-3 py-2 font-medium">Games</th>
            <th className="px-3 py-2 font-medium">W</th>
            <th className="px-3 py-2 font-medium">L</th>
            <th className="px-3 py-2 font-medium">Push</th>
            <th className="px-3 py-2 font-medium">Win%</th>
            <th className="px-3 py-2 font-medium">Avg Edge</th>
            <th className="px-3 py-2 font-medium">Trend</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.team} className={`border-t border-zinc-200 dark:border-zinc-700 ${rowTint(r.winPct)}`}>
              <td className="px-3 py-2 font-medium text-zinc-900 dark:text-zinc-100">{r.team}</td>
              <td className="px-3 py-2 tabular-nums">{r.gamesInvolved}</td>
              <td className="px-3 py-2 tabular-nums">{r.wins}</td>
              <td className="px-3 py-2 tabular-nums">{r.losses}</td>
              <td className="px-3 py-2 tabular-nums">{r.pushes}</td>
              <td className="px-3 py-2 tabular-nums">{r.winPct.toFixed(1)}%</td>
              <td className="px-3 py-2 tabular-nums">
                {r.avgEdge >= 0 ? '+' : ''}
                {r.avgEdge.toFixed(1)}
              </td>
              <td className="px-3 py-2">
                {r.trend === 'hot' && '🔥 Hot'}
                {r.trend === 'cold' && '❄ Cold'}
                {r.trend === 'neutral' && '→ Neutral'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {rows.length === 0 && (
        <p className="p-4 text-sm text-zinc-500">No graded picks yet (excluding PASS).</p>
      )}
    </div>
  )
}
