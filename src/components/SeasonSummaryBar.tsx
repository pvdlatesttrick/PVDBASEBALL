import type { ConfidenceBreakdown, SeasonRecord } from '@/utils/recordTracker'

type Props = {
  seasonLabel: string
  record: SeasonRecord
  confidence: ConfidenceBreakdown
}

function pctColor(pct: number): string {
  if (pct > 55) return 'text-emerald-600 dark:text-emerald-400'
  if (pct >= 50) return 'text-amber-600 dark:text-amber-400'
  return 'text-rose-600 dark:text-rose-400'
}

export function SeasonSummaryBar({ seasonLabel, record, confidence }: Props) {
  const wl = record.wins + record.losses
  const atsPct = wl === 0 ? 0 : (record.wins / wl) * 100
  const barFill = Math.min(100, wl === 0 ? 0 : (record.wins / wl) * 100)

  return (
    <section className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-700 dark:bg-zinc-900">
      <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
        AI Model Record — {seasonLabel}
      </h2>
      <div className="mt-3 flex flex-wrap gap-6">
        <div className={`text-2xl font-bold tabular-nums ${pctColor(atsPct)}`}>
          {record.wins}-{record.losses}-{record.pushes}{' '}
          <span className="text-base font-medium text-zinc-600 dark:text-zinc-400">
            ({atsPct.toFixed(1)}% ATS)
          </span>
        </div>
        <div className="text-zinc-700 dark:text-zinc-300">
          ROI:{' '}
          <span className={record.roi >= 0 ? 'text-emerald-600' : 'text-rose-600'}>
            {record.roi >= 0 ? '+' : ''}
            {record.roi.toFixed(1)}%
          </span>
        </div>
        <div className="text-zinc-700 dark:text-zinc-300">
          Current streak:{' '}
          <span className="font-semibold">
            {record.streak > 0 ? `${record.streakType}${record.streak}` : '—'}
          </span>
        </div>
      </div>
      <div className="mt-3 h-2 w-full max-w-md overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
        <div
          className="h-full rounded-full bg-emerald-500 transition-all"
          style={{ width: `${barFill}%` }}
        />
      </div>
      <div className="mt-4 grid gap-1 text-sm text-zinc-600 dark:text-zinc-400 sm:grid-cols-3">
        <div>
          High conf: {confidence.high.record} ({confidence.high.winPct.toFixed(1)}%)
        </div>
        <div>
          Med conf: {confidence.medium.record} ({confidence.medium.winPct.toFixed(1)}%)
        </div>
        <div>
          Low conf: {confidence.low.record} ({confidence.low.winPct.toFixed(1)}%)
        </div>
      </div>
      <p className="mt-3 text-sm text-zinc-600 dark:text-zinc-400">
        OVER: {record.overRecord.wins}-{record.overRecord.losses} &nbsp; UNDER:{' '}
        {record.underRecord.wins}-{record.underRecord.losses} &nbsp; PASS: {record.passes} games
      </p>
    </section>
  )
}
