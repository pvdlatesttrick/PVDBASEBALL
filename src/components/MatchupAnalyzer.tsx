import { useEffect, useMemo, useState } from 'react'
import type { MLBGame } from '@/types/matchup'
import type { GameOdds } from '@/types/odds'
import { useTodaysGames } from '@/hooks/useTodaysGames'
import { getPitcherSplits, type PitcherPlatoonSplits } from '@/data/pitcherSplits'
import { getPitcherGameLog } from '@/data/pitcherGameLog'
import { countBatterHands, findSimilarLineupComps } from '@/utils/lineupUtils'
import {
  projectExpectedRuns,
  runProjectionSignal,
  signalLabelClass,
  signalMeterClass,
} from '@/utils/runProjection'
import { findGameOdds, useOdds } from '@/context/OddsContext'
import { OddsTable } from '@/components/OddsTable'
import { ImpliedProbBar } from '@/components/ImpliedProbBar'

function fmtAmerican(n: number | null | undefined): string {
  if (n == null) return '—'
  return n > 0 ? `+${n}` : String(n)
}

function fmtSpreadShort(game: GameOdds): string {
  const a = game.bestAwaySpread
  const h = game.bestHomeSpread
  if (!a && !h) return '—'
  if (a) return `${game.awayAbbr} ${a.point > 0 ? '+' : ''}${a.point} (${fmtAmerican(a.price)})`
  if (h) return `${game.homeAbbr} ${h.point > 0 ? '+' : ''}${h.point} (${fmtAmerican(h.price)})`
  return '—'
}

function totalLean(modelCombined: number, odds: GameOdds): { line: number; diff: number; lean: string } | null {
  const line = odds.consensusTotal ?? odds.bestOver?.point ?? odds.bestUnder?.point ?? null
  if (line == null) return null
  const diff = modelCombined - line
  let lean = 'No lean'
  if (diff >= 0.75) lean = 'Lean OVER'
  else if (diff <= -0.75) lean = 'Lean UNDER'
  return { line, diff, lean }
}

const DEFAULT_SPLITS: PitcherPlatoonSplits = {
  vsLHH: {
    era: 4.25,
    obp: 0.32,
    slg: 0.42,
    kPct: 23,
    bbPct: 8,
    hardHitPct: 36,
    exitVeloAllowed: 88,
  },
  vsRHH: {
    era: 4.25,
    obp: 0.32,
    slg: 0.42,
    kPct: 23,
    bbPct: 8,
    hardHitPct: 36,
    exitVeloAllowed: 88,
  },
}

function splitsOrDefault(name: string): PitcherPlatoonSplits {
  return getPitcherSplits(name) ?? DEFAULT_SPLITS
}

function gameProjections(game: MLBGame) {
  const away = projectExpectedRuns(
    game.awayLineup,
    splitsOrDefault(game.homeStarter),
    game.venue
  )
  const home = projectExpectedRuns(
    game.homeLineup,
    splitsOrDefault(game.awayStarter),
    game.venue
  )
  return { away, home, total: away.expectedRuns + home.expectedRuns }
}

function SplitTable({ splits, title }: { splits: PitcherPlatoonSplits; title: string }) {
  const rows = [
    { label: 'ERA', l: splits.vsLHH.era.toFixed(2), r: splits.vsRHH.era.toFixed(2) },
    { label: 'OBP', l: splits.vsLHH.obp.toFixed(3), r: splits.vsRHH.obp.toFixed(3) },
    { label: 'SLG', l: splits.vsLHH.slg.toFixed(3), r: splits.vsRHH.slg.toFixed(3) },
    { label: 'K%', l: `${splits.vsLHH.kPct.toFixed(1)}%`, r: `${splits.vsRHH.kPct.toFixed(1)}%` },
    { label: 'BB%', l: `${splits.vsLHH.bbPct.toFixed(1)}%`, r: `${splits.vsRHH.bbPct.toFixed(1)}%` },
    { label: 'Hard hit%', l: `${splits.vsLHH.hardHitPct.toFixed(1)}%`, r: `${splits.vsRHH.hardHitPct.toFixed(1)}%` },
    { label: 'EV mph', l: splits.vsLHH.exitVeloAllowed.toFixed(1), r: splits.vsRHH.exitVeloAllowed.toFixed(1) },
  ]
  return (
    <div className="overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-700">
      <p className="border-b border-zinc-200 bg-zinc-50 px-3 py-2 text-sm font-medium dark:border-zinc-700 dark:bg-zinc-800/80">
        {title}
      </p>
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-zinc-200 text-xs uppercase text-zinc-500 dark:border-zinc-700">
            <th className="px-3 py-2">Stat</th>
            <th className="px-3 py-2">vs LHH</th>
            <th className="px-3 py-2">vs RHH</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.label} className="border-b border-zinc-100 dark:border-zinc-800">
              <td className="px-3 py-1.5 text-zinc-600 dark:text-zinc-400">{row.label}</td>
              <td className="px-3 py-1.5 font-mono tabular-nums">{row.l}</td>
              <td className="px-3 py-1.5 font-mono tabular-nums">{row.r}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function RunMeter({
  label,
  expectedRuns,
}: {
  label: string
  expectedRuns: number
}) {
  const signal = runProjectionSignal(expectedRuns)
  const pct = Math.min(100, (expectedRuns / 8) * 100)
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">{label}</p>
      <div className="mt-1 flex items-center gap-3">
        <div className="h-3 min-w-0 flex-1 overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-700">
          <div
            className={`h-3 rounded-full transition-all ${signalMeterClass(signal)}`}
            style={{ width: `${pct}%` }}
          />
        </div>
        <span className={`shrink-0 text-lg font-semibold tabular-nums ${signalLabelClass(signal)}`}>
          {expectedRuns.toFixed(1)}
        </span>
      </div>
      <p className="mt-0.5 text-[11px] text-zinc-500">
        Green ≥5.0 · Yellow 3.5–4.9 · Red ≤3.4 expected runs
      </p>
    </div>
  )
}

function LineupColumn({
  title,
  team,
  lineup,
  emphasize,
}: {
  title: string
  team: string
  lineup: MLBGame['awayLineup']
  emphasize: boolean
}) {
  return (
    <div
      className={`rounded-xl border p-3 ${
        emphasize
          ? 'border-blue-500 ring-2 ring-blue-500/30 dark:border-blue-500'
          : 'border-zinc-200 dark:border-zinc-700'
      }`}
    >
      <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
        {title} · {team}
      </h3>
      <ul className="mt-2 space-y-1 text-sm">
        {lineup.map((s) => (
          <li key={s.battingOrder} className="flex justify-between gap-2 border-b border-zinc-100 py-1 dark:border-zinc-800">
            <span className="text-zinc-500">{s.battingOrder}.</span>
            <span className="min-w-0 flex-1 font-medium text-zinc-900 dark:text-zinc-100">{s.playerName}</span>
            <span className="text-zinc-500">
              {s.pos} · {s.bats}
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}

export function MatchupAnalyzer() {
  const { games: oddsGames, loading: oddsLoading } = useOdds()
  const { games, loading: slateLoading } = useTodaysGames()
  const [gameId, setGameId] = useState(() => games[0]?.id ?? 0)
  useEffect(() => {
    if (!games.length) return
    if (!games.some((g) => g.id === gameId)) setGameId(games[0]!.id)
  }, [games, gameId])
  /** false: away offense vs home SP · true: home offense vs away SP */
  const [flipped, setFlipped] = useState(false)

  const game = useMemo(() => games.find((g) => g.id === gameId) ?? games[0], [games, gameId])

  const focusPitcher = game ? (flipped ? game.awayStarter : game.homeStarter) : ''
  const focusLineup = game ? (flipped ? game.homeLineup : game.awayLineup) : []
  const focusLabel = game
    ? flipped
      ? `${game.homeTeam} vs ${game.awayStarter}`
      : `${game.awayTeam} vs ${game.homeStarter}`
    : ''

  const splits = splitsOrDefault(focusPitcher)
  const projection = useMemo(() => {
    if (!game || focusLineup.length === 0) return { expectedRuns: 0, signal: 'red' as const }
    return projectExpectedRuns(focusLineup, splits, game.venue)
  }, [game, focusLineup, splits])

  const log = focusPitcher ? getPitcherGameLog(focusPitcher) : []
  const comps = useMemo(() => {
    if (focusLineup.length === 0) return []
    return findSimilarLineupComps(focusLineup, log, 5)
  }, [focusLineup, log])

  const hands = countBatterHands(focusLineup)

  const slateProjections = useMemo(() => {
    return games.map((g) => ({ g, ...gameProjections(g) }))
  }, [games])

  const selectedOdds = useMemo(() => {
    if (!game) return undefined
    return findGameOdds(game.awayTeam, game.homeTeam, oddsGames)
  }, [game, oddsGames])

  const selectedModelTotal = useMemo(() => {
    if (!game) return 0
    const a = projectExpectedRuns(
      game.awayLineup,
      splitsOrDefault(game.homeStarter),
      game.venue
    )
    const h = projectExpectedRuns(
      game.homeLineup,
      splitsOrDefault(game.awayStarter),
      game.venue
    )
    return a.expectedRuns + h.expectedRuns
  }, [game])

  const leanInfo = selectedOdds ? totalLean(selectedModelTotal, selectedOdds) : null

  if (!game) {
    return <p className="text-zinc-500">No games loaded.</p>
  }

  return (
    <div className="space-y-6 rounded-xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/40">
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          Matchup analyzer
        </h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          Platoon-weighted run projection · park factor · historical lineup comps. Slate loads from MLB
          Stats API (falls back to bundled sample if offline).
          {slateLoading && ' Loading schedule…'}
        </p>
        <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
          For entertainment and fantasy purposes only.
        </p>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2">
        {slateProjections.map(({ g, away, home, total }) => {
          const active = g.id === gameId
          const awaySig = runProjectionSignal(away.expectedRuns)
          const homeSig = runProjectionSignal(home.expectedRuns)
          const cardOdds = findGameOdds(g.awayTeam, g.homeTeam, oddsGames)
          return (
            <button
              key={g.id}
              type="button"
              onClick={() => setGameId(g.id)}
              className={`min-w-[200px] shrink-0 rounded-xl border p-3 text-left transition-colors ${
                active
                  ? 'border-blue-600 bg-blue-50 dark:border-blue-500 dark:bg-blue-950/40'
                  : 'border-zinc-200 bg-white hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900/40 dark:hover:bg-zinc-800/50'
              }`}
            >
              <p className="text-xs text-zinc-500">{g.gameTime}</p>
              <p className="font-semibold text-zinc-900 dark:text-zinc-100">
                {g.awayTeam} @ {g.homeTeam}
              </p>
              <p className="mt-1 truncate text-xs text-zinc-500">{g.venue}</p>
              {cardOdds && !oddsLoading && (
                <p className="mt-1 font-mono text-[10px] leading-snug text-zinc-700 dark:text-zinc-300">
                  ML {fmtAmerican(cardOdds.bestAwayMl?.price)} / {fmtAmerican(cardOdds.bestHomeMl?.price)} · O/U{' '}
                  {cardOdds.consensusTotal ?? cardOdds.bestOver?.point ?? '—'} · RL {fmtSpreadShort(cardOdds)}
                </p>
              )}
              {oddsLoading && <p className="mt-1 text-[10px] text-zinc-400">Odds…</p>}
              <div
                className="mt-2 flex h-2 overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-700"
                title={`${g.awayTeam} ${away.expectedRuns.toFixed(1)} @ ${g.homeTeam} ${home.expectedRuns.toFixed(1)}`}
              >
                <div
                  className={`${signalMeterClass(awaySig)}`}
                  style={{ flex: Math.max(0.15, away.expectedRuns) }}
                />
                <div
                  className={`${signalMeterClass(homeSig)}`}
                  style={{ flex: Math.max(0.15, home.expectedRuns) }}
                />
              </div>
              <p className="mt-1 font-mono text-xs tabular-nums text-zinc-600 dark:text-zinc-400">
                {away.expectedRuns.toFixed(1)} — {home.expectedRuns.toFixed(1)} runs · {total.toFixed(1)} combined
              </p>
            </button>
          )
        })}
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_minmax(280px,380px)_1fr]">
        <LineupColumn
          title="Away"
          team={game.awayTeam}
          lineup={game.awayLineup}
          emphasize={!flipped}
        />

        <div className="space-y-4 rounded-xl border border-zinc-200 bg-zinc-50/80 p-4 dark:border-zinc-700 dark:bg-zinc-900/50">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="text-xs uppercase text-zinc-500">Matchup focus</p>
              <p className="font-medium text-zinc-900 dark:text-zinc-100">{focusLabel}</p>
            </div>
            <button
              type="button"
              onClick={() => setFlipped((f) => !f)}
              className="rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-sm font-medium text-zinc-800 shadow-sm hover:bg-zinc-50 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800"
            >
              Flip pitcher
            </button>
          </div>

          <SplitTable splits={splits} title={`${focusPitcher} — career splits`} />

          <RunMeter label={`Expected runs (${focusLabel.split(' vs ')[0]?.trim() ?? 'offense'})`} expectedRuns={projection.expectedRuns} />

          {selectedOdds && (
            <div className="space-y-3 border-t border-zinc-200 pt-3 dark:border-zinc-700">
              <p className="text-xs font-semibold uppercase text-zinc-500">Sportsbook odds</p>
              <ImpliedProbBar game={selectedOdds} />
              {leanInfo && (
                <div className="rounded-lg border border-zinc-200 bg-white p-2 text-sm dark:border-zinc-600 dark:bg-zinc-950">
                  <p className="text-xs text-zinc-500">Model total vs consensus</p>
                  <p className="font-mono tabular-nums text-zinc-800 dark:text-zinc-200">
                    Projected combined: {selectedModelTotal.toFixed(2)} · Line: {leanInfo.line.toFixed(1)} · Δ{' '}
                    {leanInfo.diff >= 0 ? '+' : ''}
                    {leanInfo.diff.toFixed(2)}
                  </p>
                  <p
                    className={`mt-1 font-semibold ${
                      leanInfo.lean.includes('OVER')
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : leanInfo.lean.includes('UNDER')
                          ? 'text-rose-600 dark:text-rose-400'
                          : 'text-zinc-600 dark:text-zinc-400'
                    }`}
                  >
                    {leanInfo.lean} (threshold ±0.75 runs)
                  </p>
                </div>
              )}
              <OddsTable game={selectedOdds} />
            </div>
          )}

          <div>
            <p className="text-xs font-medium uppercase text-zinc-500">Lineup handedness</p>
            <p className="text-sm text-zinc-700 dark:text-zinc-300">
              {hands.lhh} L · {hands.rhh} R · {hands.sh} S
            </p>
          </div>

          <div>
            <p className="text-xs font-medium uppercase text-zinc-500">Similar 2024 starts (lineup mix)</p>
            <ul className="mt-2 space-y-2 text-sm">
              {comps.map(({ entry, similarity }, i) => (
                <li
                  key={`${entry.date}-${entry.opponent}-${i}`}
                  className="flex flex-wrap justify-between gap-2 rounded-lg border border-zinc-200 bg-white px-2 py-1.5 dark:border-zinc-600 dark:bg-zinc-950"
                >
                  <span className="text-zinc-600 dark:text-zinc-400">
                    {entry.date} · {entry.opponent}
                  </span>
                  <span className="font-mono text-xs text-zinc-500">
                    sim {(similarity * 100).toFixed(0)}% · {entry.ip} IP · {entry.er} ER
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <LineupColumn
          title="Home"
          team={game.homeTeam}
          lineup={game.homeLineup}
          emphasize={flipped}
        />
      </div>
    </div>
  )
}
