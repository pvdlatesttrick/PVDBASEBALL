import { useMemo, useState } from 'react'
import type { GamePrediction, PredictionFactor } from '@/types/prediction'

function factorArrow(f: PredictionFactor): string {
  if (f.direction === 'bullish') return '▲'
  if (f.direction === 'bearish') return '▼'
  return '◆'
}

function borderClass(p: GamePrediction): string {
  if (p.result === 'WIN') return 'border-emerald-500 ring-1 ring-emerald-500/30'
  if (p.result === 'LOSS') return 'border-rose-500 ring-1 ring-rose-500/30'
  if (p.result === 'PUSH') return 'border-amber-500 ring-1 ring-amber-500/30'
  return 'border-zinc-200 dark:border-zinc-600'
}

function callBadgeClass(call: GamePrediction['call']): string {
  if (call === 'OVER') return 'bg-blue-600 text-white'
  if (call === 'UNDER') return 'bg-orange-600 text-white'
  return 'bg-zinc-500 text-white'
}

function confidenceBadgeClass(c: GamePrediction['confidence']): string {
  if (c === 'high') return 'border-transparent bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900'
  if (c === 'medium') return 'border-2 border-zinc-800 bg-transparent text-zinc-900 dark:border-zinc-200 dark:text-zinc-100'
  return 'border-2 border-dashed border-zinc-500 bg-transparent text-zinc-800 dark:text-zinc-200'
}

type Props = {
  game: GamePrediction
  gameTimeLabel: string
}

export function PredictionCard({ game, gameTimeLabel }: Props) {
  const [open, setOpen] = useState(false)

  const topFactors = useMemo(() => {
    return [...game.factors]
      .sort((a, b) => Math.abs(b.impact) - Math.abs(a.impact))
      .slice(0, 3)
  }, [game.factors])

  return (
    <article
      className={`cursor-pointer rounded-xl border bg-white p-4 transition dark:bg-zinc-900 ${borderClass(game)}`}
      onClick={() => setOpen((o) => !o)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          setOpen((o) => !o)
        }
      }}
      role="button"
      tabIndex={0}
    >
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <div className="font-semibold text-zinc-900 dark:text-zinc-100">
          {game.awayTeam} @ {game.homeTeam} · {gameTimeLabel}
        </div>
      </div>
      <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
        {game.awayStarter} vs {game.homeStarter}
      </p>

      <dl className="mt-3 grid grid-cols-2 gap-2 text-sm">
        <dt className="text-zinc-500">O/U Line</dt>
        <dd className="text-right font-medium">{game.ouLine}</dd>
        <dt className="text-zinc-500">AI Predicted</dt>
        <dd className="text-right font-medium">
          {game.predictedTotal}{' '}
          <span className={game.edge >= 0 ? 'text-emerald-600' : 'text-rose-600'}>
            ({game.edge >= 0 ? '+' : ''}
            {game.edge.toFixed(1)})
          </span>
        </dd>
      </dl>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <span
          className={`inline-flex rounded-lg px-3 py-1.5 text-sm font-semibold ${callBadgeClass(game.call)}`}
        >
          {game.call}
        </span>
        <span
          className={`inline-flex rounded-lg px-2.5 py-1 text-xs font-medium ${confidenceBadgeClass(game.confidence)}`}
        >
          {game.confidence} confidence
        </span>
      </div>

      <div className="mt-3">
        <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">Key factors</p>
        <ul className="mt-1 space-y-1 text-sm text-zinc-700 dark:text-zinc-300">
          {topFactors.map((f) => (
            <li key={f.name}>
              {factorArrow(f)} {f.name}: {f.description.slice(0, 120)}
              {f.description.length > 120 ? '…' : ''}
            </li>
          ))}
        </ul>
      </div>

      <p className="mt-3 text-sm text-zinc-600 dark:text-zinc-400">
        Result:{' '}
        <span className="font-semibold text-zinc-900 dark:text-zinc-100">{game.result}</span>
        {game.actualTotal !== null && (
          <span className="ml-2">
            ({game.actualAwayRuns}-{game.actualHomeRuns}, {game.actualTotal} runs)
          </span>
        )}
      </p>

      {open && (
        <div className="mt-4 border-t border-zinc-200 pt-4 dark:border-zinc-700">
          <p className="text-xs font-medium uppercase text-zinc-500">All factors</p>
          <ul className="mt-2 space-y-2 text-sm">
            {game.factors.map((f) => (
              <li key={f.name} className="rounded-lg bg-zinc-50 p-2 dark:bg-zinc-800">
                <div className="flex justify-between font-medium text-zinc-900 dark:text-zinc-100">
                  <span>
                    {factorArrow(f)} {f.name}
                  </span>
                  <span className="tabular-nums text-zinc-600">
                    {f.impact >= 0 ? '+' : ''}
                    {f.impact.toFixed(2)} (w×{f.weight})
                  </span>
                </div>
                <p className="mt-1 text-zinc-600 dark:text-zinc-400">{f.description}</p>
              </li>
            ))}
          </ul>
        </div>
      )}
    </article>
  )
}
