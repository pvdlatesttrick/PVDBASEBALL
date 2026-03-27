/**
 * Loose stat projection shape used by `data/statLineBuilder.ts` and `PLAYER_STATS`.
 * Maps onto `HittingStats` / `PitchingStats` / `AdvancedStats` in `buildPlayer`.
 */
export type PlayerStatLine = {
  // Hitters
  pa?: number
  avg?: number
  obp?: number
  slg?: number
  hr?: number
  rbi?: number
  r?: number
  sb?: number
  cs?: number
  bbPct?: number
  kPct?: number
  // Pitchers
  ip?: number
  era?: number
  whip?: number
  k9?: number
  bb9?: number
  kbbPct?: number
  fip?: number
  xfip?: number
  sv?: number
  holds?: number
  svh?: number
  // Advanced — hitters
  babip?: number
  hardHitPct?: number
  barrelPct?: number
  xba?: number
  xslg?: number
  exitVelo?: number
  launchAngle?: number
  sprintSpeed?: number
  chasePct?: number
  contactPct?: number
  swstrPct?: number
  pullPct?: number
  oppoPct?: number
  centerPct?: number
  // Advanced — pitchers
  siera?: number
  stuffPlus?: number
  locationPlus?: number
  cswPct?: number
  gbPct?: number
  fbPct?: number
  hrFbPct?: number
  babipAllowed?: number
  hardHitAllowed?: number
  barrelAllowed?: number
  exitVeloAllowed?: number
  spinRate?: number
  fastballVelo?: number
  // Shared
  fWAR?: number
}
