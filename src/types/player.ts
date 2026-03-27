/** Standard hitting line (season totals) */
export type HittingStats = {
  pa: number
  avg: number
  obp: number
  slg: number
  ops: number
  hr: number
  rbi: number
  sb: number
  cs: number
  bbPct: number
  kPct: number
}

/** Standard pitching line (season totals) */
export type PitchingStats = {
  ip: number
  era: number
  whip: number
  k9: number
  bb9: number
  kbbPct: number
  fip: number
  xfip: number
  sv: number
  holds: number
}

/** Advanced metrics — hitters (Savant-style) */
export type HittingAdvanced = {
  kind: 'hitter'
  babip: number
  hardHitPct: number
  barrelPct: number
  xba: number
  xslg: number
  exitVeloAvg: number
  launchAngleAvg: number
  sprintSpeed: number
  pullPct: number
  oppoPct: number
  centerPct: number
  chasePct: number
  contactPct: number
  swStrPct: number
}

/** Advanced metrics — pitchers */
export type PitchingAdvanced = {
  kind: 'pitcher'
  fip: number
  xfip: number
  siera: number
  stuffPlus: number
  locationPlus: number
  cswPct: number
  gbPct: number
  fbPct: number
  hrfbPct: number
  babipAllowed: number
  hardHitAllowedPct: number
  barrelAllowedPct: number
  exitVeloAllowed: number
  spinRateFastball: number
  veloFastball: number
}

export type AdvancedStats = HittingAdvanced | PitchingAdvanced

/** Eight roto category values used for live ranking (all numeric for sorting) */
export type RotoValues = {
  obp: number
  slg: number
  hr: number
  netSb: number
  kbbPct: number
  whip: number
  era: number
  svH: number
}

export type PlayerRole = 'hitter' | 'pitcher'

export type Player = {
  id: number
  /** Initial sort seed; board order is stored separately in draft state */
  rank: number
  name: string
  pos: string
  team: string
  adp: number
  drafted: boolean
  fWAR: number
  writeup: string
  role: PlayerRole
  injury?: string | null
  hitting?: HittingStats
  pitching?: PitchingStats
  advanced: AdvancedStats
  roto: RotoValues
}

export const ROTO_KEYS = [
  'obp',
  'slg',
  'hr',
  'netSb',
  'kbbPct',
  'whip',
  'era',
  'svH',
] as const

export type RotoKey = (typeof ROTO_KEYS)[number]

/** Lower stat value is better for these categories */
export const ROTO_LOWER_IS_BETTER: ReadonlySet<RotoKey> = new Set(['whip', 'era'])
