export type PredictionFactor = {
  name: string
  impact: number
  direction: 'bullish' | 'bearish' | 'neutral'
  description: string
  weight: number
}

export type GamePrediction = {
  gameId: string
  date: string
  homeTeam: string
  awayTeam: string
  homeStarter: string
  awayStarter: string
  venue: string
  ouLine: number
  overOdds: number
  underOdds: number
  predictedTotal: number
  predictedHomeRuns: number
  predictedAwayRuns: number
  call: 'OVER' | 'UNDER' | 'PASS'
  edge: number
  confidence: 'high' | 'medium' | 'low'
  factors: PredictionFactor[]
  actualTotal: number | null
  actualHomeRuns: number | null
  actualAwayRuns: number | null
  result: 'WIN' | 'LOSS' | 'PUSH' | 'PENDING'
  gradedAt: string | null
  /** Resolved MLB Stats API gamePk when available (for grading). */
  mlbGamePk: number | null
}
