import type { GamePrediction } from '@/types/prediction'

export type SeasonRecord = {
  wins: number
  losses: number
  pushes: number
  passes: number
  winPct: number
  roi: number
  streak: number
  streakType: 'W' | 'L'
  bestStreak: number
  worstStreak: number
  highConfidence: { wins: number; losses: number; pushes: number }
  mediumConfidence: { wins: number; losses: number; pushes: number }
  lowConfidence: { wins: number; losses: number; pushes: number }
  overRecord: { wins: number; losses: number }
  underRecord: { wins: number; losses: number }
  monthlyRecords: Record<string, { wins: number; losses: number }>
}

export type TeamBreakdown = {
  team: string
  gamesInvolved: number
  wins: number
  losses: number
  pushes: number
  winPct: number
  avgEdge: number
  trend: 'hot' | 'cold' | 'neutral'
  notes: string
}

export type VenueBreakdown = {
  venue: string
  team: string
  gamesPlayed: number
  wins: number
  losses: number
  winPct: number
  avgPredictedTotal: number
  avgActualTotal: number
  bias: number
}

export type ConfidenceBreakdown = {
  high: { record: string; winPct: number; roi: number }
  medium: { record: string; winPct: number; roi: number }
  low: { record: string; winPct: number; roi: number }
}

function roiFromWl(wins: number, losses: number): number {
  const d = wins + losses
  if (d === 0) return 0
  return ((wins * (100 / 110) - losses) / d) * 100
}

function recordStr(w: number, l: number, p: number): string {
  return `${w}-${l}${p > 0 ? `-${p}` : ''}`
}

function addMonthly(
  map: Record<string, { wins: number; losses: number }>,
  monthKey: string,
  w: boolean,
  l: boolean
): void {
  if (!map[monthKey]) map[monthKey] = { wins: 0, losses: 0 }
  if (w) map[monthKey].wins++
  if (l) map[monthKey].losses++
}

export function computeSeasonRecord(predictions: GamePrediction[]): SeasonRecord {
  let wins = 0
  let losses = 0
  let pushes = 0
  let passes = 0
  const highConfidence = { wins: 0, losses: 0, pushes: 0 }
  const mediumConfidence = { wins: 0, losses: 0, pushes: 0 }
  const lowConfidence = { wins: 0, losses: 0, pushes: 0 }
  const overRecord = { wins: 0, losses: 0 }
  const underRecord = { wins: 0, losses: 0 }
  const monthlyRecords: Record<string, { wins: number; losses: number }> = {}

  const graded = predictions.filter((p) => p.result !== 'PENDING')
  const chronological = [...graded].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  )

  for (const p of graded) {
    if (p.call === 'PASS') {
      passes++
      continue
    }

    const monthKey = p.date.slice(0, 7)
    if (p.result === 'WIN') wins++
    else if (p.result === 'LOSS') losses++
    else if (p.result === 'PUSH') pushes++

    if (p.result === 'WIN') addMonthly(monthlyRecords, monthKey, true, false)
    else if (p.result === 'LOSS') addMonthly(monthlyRecords, monthKey, false, true)

    const conf =
      p.confidence === 'high'
        ? highConfidence
        : p.confidence === 'medium'
          ? mediumConfidence
          : lowConfidence
    if (p.result === 'WIN') conf.wins++
    else if (p.result === 'LOSS') conf.losses++
    else conf.pushes++

    if (p.call === 'OVER') {
      if (p.result === 'WIN') overRecord.wins++
      else if (p.result === 'LOSS') overRecord.losses++
    } else if (p.call === 'UNDER') {
      if (p.result === 'WIN') underRecord.wins++
      else if (p.result === 'LOSS') underRecord.losses++
    }
  }

  const wl = wins + losses
  const winPct = wl === 0 ? 0 : (wins / wl) * 100
  const roi = roiFromWl(wins, losses)

  let bestStreak = 0
  let worstStreak = 0
  let runW = 0
  let runL = 0
  for (const p of chronological) {
    if (p.call === 'PASS' || p.result === 'PUSH') continue
    if (p.result === 'WIN') {
      runW++
      runL = 0
      bestStreak = Math.max(bestStreak, runW)
    } else if (p.result === 'LOSS') {
      runL++
      runW = 0
      worstStreak = Math.max(worstStreak, runL)
    }
  }

  let streak = 0
  let streakType: 'W' | 'L' = 'W'
  const recent = [...chronological].reverse()
  for (const p of recent) {
    if (p.call === 'PASS' || p.result === 'PUSH') continue
    if (p.result !== 'WIN' && p.result !== 'LOSS') continue
    if (streak === 0) {
      streak = 1
      streakType = p.result === 'WIN' ? 'W' : 'L'
      continue
    }
    if (p.result === 'WIN' && streakType === 'W') streak++
    else if (p.result === 'LOSS' && streakType === 'L') streak++
    else break
  }

  return {
    wins,
    losses,
    pushes,
    passes,
    winPct,
    roi,
    streak,
    streakType,
    bestStreak,
    worstStreak,
    highConfidence,
    mediumConfidence,
    lowConfidence,
    overRecord,
    underRecord,
    monthlyRecords,
  }
}

function confWinPct(c: { wins: number; losses: number; pushes: number }): number {
  const d = c.wins + c.losses
  return d === 0 ? 0 : (c.wins / d) * 100
}

export function computeConfidenceBreakdown(predictions: GamePrediction[]): ConfidenceBreakdown {
  const sr = computeSeasonRecord(predictions)
  const h = sr.highConfidence
  const m = sr.mediumConfidence
  const l = sr.lowConfidence
  return {
    high: {
      record: recordStr(h.wins, h.losses, h.pushes),
      winPct: confWinPct(h),
      roi: roiFromWl(h.wins, h.losses),
    },
    medium: {
      record: recordStr(m.wins, m.losses, m.pushes),
      winPct: confWinPct(m),
      roi: roiFromWl(m.wins, m.losses),
    },
    low: {
      record: recordStr(l.wins, l.losses, l.pushes),
      winPct: confWinPct(l),
      roi: roiFromWl(l.wins, l.losses),
    },
  }
}

export function computeTeamBreakdowns(predictions: GamePrediction[]): TeamBreakdown[] {
  const graded = predictions.filter((p) => p.result !== 'PENDING' && p.call !== 'PASS')
  const byTeam = new Map<
    string,
    { w: number; l: number; p: number; n: number; edgeSum: number }
  >()

  for (const p of graded) {
    for (const t of [p.homeTeam, p.awayTeam]) {
      const cur = byTeam.get(t) ?? { w: 0, l: 0, p: 0, n: 0, edgeSum: 0 }
      cur.n++
      cur.edgeSum += p.edge
      if (p.result === 'WIN') cur.w++
      else if (p.result === 'LOSS') cur.l++
      else cur.p++
      byTeam.set(t, cur)
    }
  }

  const rows: TeamBreakdown[] = []
  for (const [team, c] of byTeam) {
    const wl = c.w + c.l
    const winPct = wl === 0 ? 0 : (c.w / wl) * 100
    let trend: TeamBreakdown['trend'] = 'neutral'
    if (winPct > 65) trend = 'hot'
    else if (winPct < 40) trend = 'cold'
    rows.push({
      team,
      gamesInvolved: c.n,
      wins: c.w,
      losses: c.l,
      pushes: c.p,
      winPct,
      avgEdge: c.n ? c.edgeSum / c.n : 0,
      trend,
      notes: '',
    })
  }

  for (const r of rows) {
    if (r.trend === 'hot') {
      r.notes = 'Model outperforming when this club is on the card.'
    } else if (r.trend === 'cold') {
      r.notes = 'Possible blind spot — review park and pitching inputs for this team.'
    }
  }

  rows.sort((a, b) => b.winPct - a.winPct)
  return rows
}

export function computeVenueBreakdowns(
  predictions: GamePrediction[],
  teamByVenue: (venue: string) => string
): VenueBreakdown[] {
  const graded = predictions.filter(
    (p) =>
      p.result !== 'PENDING' &&
      p.call !== 'PASS' &&
      p.actualTotal !== null
  )
  const byVenue = new Map<
    string,
    {
      w: number
      l: number
      predSum: number
      actSum: number
      n: number
    }
  >()

  for (const p of graded) {
    const cur = byVenue.get(p.venue) ?? { w: 0, l: 0, predSum: 0, actSum: 0, n: 0 }
    cur.n++
    cur.predSum += p.predictedTotal
    cur.actSum += p.actualTotal ?? 0
    if (p.call === 'PASS') continue
    if (p.result === 'WIN') cur.w++
    else if (p.result === 'LOSS') cur.l++
    byVenue.set(p.venue, cur)
  }

  const rows: VenueBreakdown[] = []
  for (const [venue, c] of byVenue) {
    const wl = c.w + c.l
    const winPct = wl === 0 ? 0 : (c.w / wl) * 100
    const avgPred = c.n ? c.predSum / c.n : 0
    const avgAct = c.n ? c.actSum / c.n : 0
    rows.push({
      venue,
      team: teamByVenue(venue),
      gamesPlayed: c.n,
      wins: c.w,
      losses: c.l,
      winPct,
      avgPredictedTotal: avgPred,
      avgActualTotal: avgAct,
      bias: avgPred - avgAct,
    })
  }
  rows.sort((a, b) => b.winPct - a.winPct)
  return rows
}

/** Rolling window win rate (0–100) for graded non-PASS picks, chronological. */
export function rollingWinPctSeries(predictions: GamePrediction[], window = 10): number[] {
  const graded = predictions
    .filter((p) => p.result !== 'PENDING' && p.call !== 'PASS')
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
  const out: number[] = []
  for (let i = 0; i < graded.length; i++) {
    const start = Math.max(0, i - window + 1)
    const slice = graded.slice(start, i + 1)
    const wins = slice.filter((p) => p.result === 'WIN').length
    const total = slice.filter((p) => p.result === 'WIN' || p.result === 'LOSS').length
    out.push(total ? (wins / total) * 100 : 0)
  }
  return out
}

/** Cumulative ROI % after each graded bet (non-PASS). */
export function cumulativeRoiSeries(predictions: GamePrediction[]): number[] {
  const graded = predictions
    .filter((p) => p.result !== 'PENDING' && p.call !== 'PASS')
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
  const out: number[] = []
  let w = 0
  let l = 0
  for (const p of graded) {
    if (p.result === 'WIN') w++
    else if (p.result === 'LOSS') l++
    out.push(roiFromWl(w, l))
  }
  return out
}

export type ModelInsights = {
  strong: string
  weak: string
}

export function generateModelInsights(teamRows: TeamBreakdown[]): ModelInsights {
  if (teamRows.length === 0) {
    return {
      strong: 'Not enough graded history yet.',
      weak: 'Generate predictions and grade games to populate insights.',
    }
  }
  const best = teamRows[0]
  const worst = teamRows[teamRows.length - 1]
  return {
    strong: `Strong on ${best.team} (${best.wins}-${best.losses}${best.pushes ? `-${best.pushes}` : ''}, ${best.winPct.toFixed(1)}%) — ${best.notes || 'elevated win rate when this team appears.'}`,
    weak: `Weak spot: ${worst.team} (${worst.wins}-${worst.losses}${worst.pushes ? `-${worst.pushes}` : ''}, ${worst.winPct.toFixed(1)}%) — ${worst.notes || 'review inputs when this team is on the slate.'}`,
  }
}
