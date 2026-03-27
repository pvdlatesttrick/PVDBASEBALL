import type { GamePrediction } from '@/types/prediction'

const SCHEDULE_BASE = 'https://statsapi.mlb.com/api/v1/schedule?sportId=1'

const ABBR_NORMALIZE: Record<string, string> = {
  AZ: 'ARI',
  ATH: 'OAK',
  WSN: 'WSH',
  KCR: 'KC',
  SFG: 'SF',
  SDP: 'SD',
  TBR: 'TB',
}

function normAbbr(a: string): string {
  const u = a.toUpperCase()
  return ABBR_NORMALIZE[u] ?? u
}

export type ScheduleGame = {
  gamePk: number
  status?: { abstractGameState?: string; detailedState?: string }
  teams: {
    away: { team?: { abbreviation?: string } }
    home: { team?: { abbreviation?: string } }
  }
  linescore?: {
    teams: {
      home: { runs?: number }
      away: { runs?: number }
    }
  }
}

export async function fetchScheduleForDate(date: string): Promise<ScheduleGame[]> {
  const url = `${SCHEDULE_BASE}&date=${date}&hydrate=linescore`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`MLB schedule ${res.status}`)
  const json = (await res.json()) as { dates?: { games?: ScheduleGame[] }[] }
  return json.dates?.[0]?.games ?? []
}

export async function findGamePkForTeams(
  date: string,
  awayAbbr: string,
  homeAbbr: string
): Promise<number | null> {
  const games = await fetchScheduleForDate(date)
  const away = normAbbr(awayAbbr)
  const home = normAbbr(homeAbbr)
  for (const g of games) {
    const ga = normAbbr(g.teams?.away?.team?.abbreviation ?? '')
    const gh = normAbbr(g.teams?.home?.team?.abbreviation ?? '')
    if (ga === away && gh === home) return g.gamePk
  }
  return null
}

type LiveFeed = {
  gameData: { status: { abstractGameState: string } }
  liveData: { linescore: { teams: { home: { runs: number }; away: { runs: number } } } }
}

/** Used by tests or manual inspection — prefers schedule; falls back to live feed. */
export async function getLiveGameFeed(gamePk: number): Promise<LiveFeed> {
  const res = await fetch(`https://statsapi.mlb.com/api/v1.1/game/${gamePk}/feed/live`)
  if (!res.ok) throw new Error(`MLB feed ${res.status}`)
  const json = (await res.json()) as {
    gameData?: { status?: { abstractGameState?: string } }
    liveData?: { linescore?: { teams?: { home?: { runs?: number }; away?: { runs?: number } } } }
  }
  const status = json.gameData?.status?.abstractGameState ?? 'Live'
  const homeRuns = json.liveData?.linescore?.teams?.home?.runs ?? 0
  const awayRuns = json.liveData?.linescore?.teams?.away?.runs ?? 0
  return {
    gameData: { status: { abstractGameState: status } },
    liveData: {
      linescore: {
        teams: {
          home: { runs: homeRuns },
          away: { runs: awayRuns },
        },
      },
    },
  }
}

function runsFromScheduleGame(g: ScheduleGame): { home: number; away: number } | null {
  const h = g.linescore?.teams?.home?.runs
  const a = g.linescore?.teams?.away?.runs
  if (typeof h !== 'number' || typeof a !== 'number') return null
  return { home: h, away: a }
}

export async function gradeCompletedPredictions(
  predictions: GamePrediction[]
): Promise<GamePrediction[]> {
  const pending = predictions.filter((p) => p.result === 'PENDING')
  if (pending.length === 0) return predictions

  const byDate = new Map<string, GamePrediction[]>()
  for (const p of pending) {
    const arr = byDate.get(p.date) ?? []
    arr.push(p)
    byDate.set(p.date, arr)
  }

  for (const [date, preds] of byDate) {
    let schedule: ScheduleGame[] = []
    try {
      schedule = await fetchScheduleForDate(date)
    } catch (e) {
      console.warn(`Could not load schedule for ${date}:`, e)
      continue
    }

    const findGame = (away: string, home: string): ScheduleGame | null => {
      const awayN = normAbbr(away)
      const homeN = normAbbr(home)
      for (const g of schedule) {
        const ga = normAbbr(g.teams?.away?.team?.abbreviation ?? '')
        const gh = normAbbr(g.teams?.home?.team?.abbreviation ?? '')
        if (ga === awayN && gh === homeN) return g
      }
      return null
    }

    for (const pred of preds) {
      try {
        const g = findGame(pred.awayTeam, pred.homeTeam)
        if (!g) continue

        const status = g.status?.abstractGameState ?? ''
        if (status !== 'Final') continue

        let homeRuns: number
        let awayRuns: number
        const fromLs = runsFromScheduleGame(g)
        if (fromLs) {
          homeRuns = fromLs.home
          awayRuns = fromLs.away
        } else {
          const feed = await getLiveGameFeed(g.gamePk)
          if (feed.gameData.status.abstractGameState !== 'Final') continue
          homeRuns = feed.liveData.linescore.teams.home.runs
          awayRuns = feed.liveData.linescore.teams.away.runs
        }

        const actualTotal = homeRuns + awayRuns

        let result: 'WIN' | 'LOSS' | 'PUSH'
        if (pred.call === 'PASS') {
          result = 'WIN'
        } else if (actualTotal === pred.ouLine) {
          result = 'PUSH'
        } else if (pred.call === 'OVER' && actualTotal > pred.ouLine) {
          result = 'WIN'
        } else if (pred.call === 'UNDER' && actualTotal < pred.ouLine) {
          result = 'WIN'
        } else {
          result = 'LOSS'
        }

        pred.actualTotal = actualTotal
        pred.actualHomeRuns = homeRuns
        pred.actualAwayRuns = awayRuns
        pred.result = result
        pred.gradedAt = new Date().toISOString()
        if (!pred.mlbGamePk) pred.mlbGamePk = g.gamePk
      } catch (err) {
        console.warn(`Could not grade game ${pred.gameId}:`, err)
      }
    }
  }

  return predictions
}
