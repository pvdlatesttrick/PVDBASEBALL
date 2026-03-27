import { useMemo, useState } from 'react'
import { getTodaysGamesSync } from '@/data/todaysGames'
import { usePredictions } from '@/context/PredictionContext'
import { generateModelInsights } from '@/utils/recordTracker'
import { SeasonSummaryBar } from '@/components/SeasonSummaryBar'
import { PredictionCard } from '@/components/PredictionCard'
import { TeamBreakdownTable } from '@/components/TeamBreakdownTable'
import { VenueBreakdownTable } from '@/components/VenueBreakdownTable'
import { TrendLine } from '@/components/TrendLine'

function formatLastGen(iso: string | null): string {
  if (!iso) return 'Never'
  const d = new Date(iso)
  const now = new Date()
  const sameDay =
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  const t = d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })
  return sameDay ? `Today ${t}` : d.toLocaleString()
}

type Tab = 'teams' | 'venues' | 'trends'

export function AIScoreboard() {
  const {
    todaysPredictions,
    seasonRecord,
    confidenceBreakdown,
    teamBreakdown,
    venueBreakdown,
    rollingWinPct,
    cumulativeRoi,
    loading,
    generating,
    lastGenerationAt,
    generateTodaysPredictions,
    gradeCompleted,
  } = usePredictions()

  const [tab, setTab] = useState<Tab>('teams')

  const slate = useMemo(() => getTodaysGamesSync(), [])
  const timeByGameId = useMemo(() => {
    const m = new Map<string, string>()
    for (const g of slate) {
      m.set(`slate-${g.id}`, g.gameTime)
    }
    return m
  }, [slate])

  const insights = useMemo(() => generateModelInsights(teamBreakdown), [teamBreakdown])
  const seasonYear = new Date().getFullYear()

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          disabled={generating}
          onClick={() => void generateTodaysPredictions(false)}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {generating ? 'Generating…' : "Generate today's predictions"}
        </button>
        <span className="text-sm text-zinc-600 dark:text-zinc-400">
          Last generated: {formatLastGen(lastGenerationAt)}
        </span>
        <button
          type="button"
          disabled={loading}
          onClick={() => void gradeCompleted()}
          className="rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-800 hover:bg-zinc-50 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-50"
        >
          {loading ? 'Grading…' : 'Grade completed games'}
        </button>
        <span className="text-xs text-zinc-500">Checks MLB API for final scores</span>
      </div>

      <SeasonSummaryBar
        seasonLabel={`${seasonYear} Season`}
        record={seasonRecord}
        confidence={confidenceBreakdown}
      />

      <section>
        <h2 className="mb-3 text-lg font-semibold text-zinc-900 dark:text-zinc-100">
          Today&apos;s predictions
        </h2>
        {todaysPredictions.length === 0 ? (
          <p className="rounded-lg border border-dashed border-zinc-300 p-6 text-sm text-zinc-600 dark:border-zinc-600 dark:text-zinc-400">
            No predictions for today yet. Click generate to build the slate.
          </p>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {todaysPredictions.map((p) => (
              <PredictionCard
                key={p.gameId}
                game={p}
                gameTimeLabel={timeByGameId.get(p.gameId) ?? '—'}
              />
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="mb-3 text-lg font-semibold text-zinc-900 dark:text-zinc-100">
          Performance analytics
        </h2>
        <div className="mb-3 flex flex-wrap gap-2">
          {(
            [
              ['teams', 'Team breakdown'],
              ['venues', 'Venue breakdown'],
              ['trends', 'Trend charts'],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => setTab(id)}
              className={`rounded-md px-3 py-1.5 text-sm font-medium ${
                tab === id
                  ? 'bg-blue-600 text-white'
                  : 'bg-zinc-200 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {tab === 'teams' && (
          <div className="space-y-4">
            <TeamBreakdownTable rows={teamBreakdown} />
            <div className="rounded-lg border border-zinc-200 bg-amber-50/80 p-4 text-sm text-zinc-800 dark:border-zinc-700 dark:bg-amber-950/30 dark:text-zinc-200">
              <p className="font-medium text-zinc-900 dark:text-zinc-100">Model insight</p>
              <p className="mt-2">{insights.strong}</p>
              <p className="mt-2">{insights.weak}</p>
            </div>
          </div>
        )}

        {tab === 'venues' && <VenueBreakdownTable rows={venueBreakdown} />}

        {tab === 'trends' && (
          <div className="grid gap-6 md:grid-cols-2">
            <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-700 dark:bg-zinc-900">
              <h3 className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                Rolling 10-game win %
              </h3>
              <TrendLine data={rollingWinPct} color="#2563eb" />
            </div>
            <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-700 dark:bg-zinc-900">
              <h3 className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                Cumulative ROI (%)
              </h3>
              <TrendLine data={cumulativeRoi} color="#059669" />
            </div>
          </div>
        )}
      </section>

      <footer className="rounded-lg border border-zinc-200 bg-zinc-50 p-4 text-center text-xs text-zinc-600 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-400">
        This model is for entertainment and fantasy baseball purposes only. It does not constitute
        sports betting advice. Past performance does not guarantee future results.
      </footer>
    </div>
  )
}
