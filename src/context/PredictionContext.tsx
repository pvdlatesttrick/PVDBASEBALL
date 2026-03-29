import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type { GamePrediction } from '@/types/prediction'
import { fetchTodaysGames } from '@/data/todaysGames'
import { BALLPARKS } from '@/data/ballparks'
import { findGameOdds, useOdds } from '@/context/OddsContext'
import { useNews } from '@/context/NewsContext'
import {
  buildBallparkForGame,
  generatePrediction,
  resolvePitcherSplits,
} from '@/utils/predictionEngine'
import { getTeamStats } from '@/data/teamStats'
import { getGameWeather } from '@/services/weatherService'
import type { WeatherData } from '@/services/weatherService'
import { findGamePkForTeams, gradeCompletedPredictions } from '@/utils/gradingService'
import {
  computeConfidenceBreakdown,
  computeSeasonRecord,
  computeTeamBreakdowns,
  computeVenueBreakdowns,
  cumulativeRoiSeries,
  rollingWinPctSeries,
  type SeasonRecord,
  type TeamBreakdown,
  type VenueBreakdown,
  type ConfidenceBreakdown,
} from '@/utils/recordTracker'

const STORAGE_KEY = 'mlb_predictions'
const SIX_MONTHS_MS = 180 * 24 * 60 * 60 * 1000
const GRADE_INTERVAL_MS = 30 * 60 * 1000

const FALLBACK_WEATHER: WeatherData = {
  tempF: 72,
  windSpeed: 6,
  windFromDeg: 220,
  windDirection: 'cross',
  precipProbability: 12,
  isRoofClosed: false,
}

export type PredictionStore = {
  predictions: GamePrediction[]
  lastUpdated: string
  lastGenerationAt: string | null
}

function todayISO(): string {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function readStore(): PredictionStore {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      return { predictions: [], lastUpdated: new Date().toISOString(), lastGenerationAt: null }
    }
    const p = JSON.parse(raw) as PredictionStore
    if (!p?.predictions || !Array.isArray(p.predictions)) {
      return { predictions: [], lastUpdated: new Date().toISOString(), lastGenerationAt: null }
    }
    return {
      predictions: p.predictions,
      lastUpdated: p.lastUpdated ?? new Date().toISOString(),
      lastGenerationAt: p.lastGenerationAt ?? null,
    }
  } catch {
    return { predictions: [], lastUpdated: new Date().toISOString(), lastGenerationAt: null }
  }
}

function writeStore(store: PredictionStore): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store))
  } catch {
    /* quota */
  }
}

function pruneOld(predictions: GamePrediction[]): GamePrediction[] {
  const cutoff = Date.now() - SIX_MONTHS_MS
  return predictions.filter((p) => {
    const t = new Date(p.date).getTime()
    return !Number.isNaN(t) && t >= cutoff
  })
}

function homeTeamForVenue(venue: string): string {
  return BALLPARKS.find((b) => b.name === venue)?.team ?? '—'
}

export type PredictionContextValue = {
  todaysPredictions: GamePrediction[]
  allPredictions: GamePrediction[]
  seasonRecord: SeasonRecord
  teamBreakdown: TeamBreakdown[]
  venueBreakdown: VenueBreakdown[]
  confidenceBreakdown: ConfidenceBreakdown
  rollingWinPct: number[]
  cumulativeRoi: number[]
  loading: boolean
  generating: boolean
  lastGenerationAt: string | null
  generateTodaysPredictions: (force?: boolean) => Promise<void>
  gradeCompleted: () => Promise<void>
}

const PredictionContext = createContext<PredictionContextValue | null>(null)

export function PredictionProvider({ children }: { children: ReactNode }) {
  const { games: oddsGames } = useOdds()
  const { items: newsItems } = useNews()
  const [store, setStore] = useState<PredictionStore>(() => readStore())
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)

  useEffect(() => {
    setLoading(false)
  }, [])

  const persist = useCallback((next: PredictionStore) => {
    const pruned = { ...next, predictions: pruneOld(next.predictions) }
    pruned.lastUpdated = new Date().toISOString()
    writeStore(pruned)
    setStore(pruned)
  }, [])

  const runGrade = useCallback(async () => {
    const s = readStore()
    const before = JSON.stringify(s.predictions)
    const graded = await gradeCompletedPredictions([...s.predictions])
    if (JSON.stringify(graded) !== before) {
      persist({ ...s, predictions: graded })
    }
  }, [persist])

  useEffect(() => {
    void runGrade()
    const id = window.setInterval(() => void runGrade(), GRADE_INTERVAL_MS)
    return () => window.clearInterval(id)
  }, [runGrade])

  const generateTodaysPredictions = useCallback(
    async (force?: boolean) => {
      const today = todayISO()
      const current = readStore()
      const hasToday = current.predictions.some((p) => p.date === today)
      if (hasToday && !force) {
        const ok = window.confirm(
          'Predictions already exist for today — regenerate? Ungraded picks will be replaced; graded picks are kept.'
        )
        if (!ok) return
      }

      setGenerating(true)
      try {
        const games = await fetchTodaysGames()
        const venues = [...new Set(games.map((g) => g.venue))]
        const weatherMap = new Map<string, Awaited<ReturnType<typeof getGameWeather>>>()
        await Promise.all(
          venues.map(async (v) => {
            const w = await getGameWeather(v)
            weatherMap.set(v, w)
          })
        )

        const pkMap = new Map<string, number | null>()
        await Promise.all(
          games.map(async (g) => {
            const key = `${g.awayTeam}|${g.homeTeam}`
            if (pkMap.has(key)) return
            const pk = await findGamePkForTeams(today, g.awayTeam, g.homeTeam)
            pkMap.set(key, pk)
          })
        )

        const nextBatch: GamePrediction[] = games.map((game) => {
          const odds = findGameOdds(game.awayTeam, game.homeTeam, oddsGames)
          const ouLine = odds?.consensusTotal ?? 8.5
          const overOdds = odds?.bestOver?.price ?? -110
          const underOdds = odds?.bestUnder?.price ?? -110
          const homeSplits = resolvePitcherSplits(game.homeStarter)
          const awaySplits = resolvePitcherSplits(game.awayStarter)
          const homeStats = getTeamStats(game.homeTeam)
          const awayStats = getTeamStats(game.awayTeam)
          const ballpark = buildBallparkForGame(game.venue)
          const weather = weatherMap.get(game.venue) ?? FALLBACK_WEATHER
          const key = `${game.awayTeam}|${game.homeTeam}`
          const lookedUp = pkMap.get(key) ?? null
          const pk = game.id >= 100 ? game.id : lookedUp

          return generatePrediction(
            game,
            homeSplits,
            awaySplits,
            homeStats,
            awayStats,
            ballpark,
            weather,
            newsItems,
            ouLine,
            overOdds,
            underOdds,
            today,
            pk
          )
        })

        const withoutPendingToday = current.predictions.filter(
          (p) => !(p.date === today && p.result === 'PENDING')
        )
        const merged = [...withoutPendingToday, ...nextBatch]
        persist({
          predictions: merged,
          lastUpdated: new Date().toISOString(),
          lastGenerationAt: new Date().toISOString(),
        })
      } finally {
        setGenerating(false)
      }
    },
    [newsItems, oddsGames, persist]
  )

  const gradeCompleted = useCallback(async () => {
    setLoading(true)
    try {
      await runGrade()
    } finally {
      setLoading(false)
    }
  }, [runGrade])

  const allPredictions = store.predictions
  const today = todayISO()
  const todaysPredictions = useMemo(
    () => allPredictions.filter((p) => p.date === today),
    [allPredictions, today]
  )

  const seasonRecord = useMemo(() => computeSeasonRecord(allPredictions), [allPredictions])
  const teamBreakdown = useMemo(() => computeTeamBreakdowns(allPredictions), [allPredictions])
  const venueBreakdown = useMemo(
    () => computeVenueBreakdowns(allPredictions, homeTeamForVenue),
    [allPredictions]
  )
  const confidenceBreakdown = useMemo(
    () => computeConfidenceBreakdown(allPredictions),
    [allPredictions]
  )
  const rollingWinPct = useMemo(() => rollingWinPctSeries(allPredictions, 10), [allPredictions])
  const cumulativeRoi = useMemo(() => cumulativeRoiSeries(allPredictions), [allPredictions])

  const value = useMemo<PredictionContextValue>(
    () => ({
      todaysPredictions,
      allPredictions,
      seasonRecord,
      teamBreakdown,
      venueBreakdown,
      confidenceBreakdown,
      rollingWinPct,
      cumulativeRoi,
      loading,
      generating,
      lastGenerationAt: store.lastGenerationAt,
      generateTodaysPredictions,
      gradeCompleted,
    }),
    [
      todaysPredictions,
      allPredictions,
      seasonRecord,
      teamBreakdown,
      venueBreakdown,
      confidenceBreakdown,
      rollingWinPct,
      cumulativeRoi,
      loading,
      generating,
      store.lastGenerationAt,
      generateTodaysPredictions,
      gradeCompleted,
    ]
  )

  return <PredictionContext.Provider value={value}>{children}</PredictionContext.Provider>
}

export function usePredictions(): PredictionContextValue {
  const ctx = useContext(PredictionContext)
  if (!ctx) throw new Error('usePredictions must be used within PredictionProvider')
  return ctx
}
