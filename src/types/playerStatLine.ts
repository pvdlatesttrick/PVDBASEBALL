/**
 * Projected 2025 stat line — keyed by player name in `PLAYER_STATS`.
 *
 * Hitters: pa, avg, obp, slg, hr, rbi, r, sb, cs, bbPct, kPct, babip, hardHitPct,
 * barrelPct, xba, xslg, exitVelo, launchAngle, sprintSpeed, chasePct, contactPct,
 * swstrPct, pullPct, oppoPct, centerPct, fWAR
 *
 * Pitchers: ip, era, whip, k9, bb9, kbbPct | kBBPct, fip, xfip, siera, sv, holds, svh,
 * stuffPlus, locationPlus, cswPct, gbPct, fbPct, hrFbPct, babipAllowed, hardHitAllowed,
 * barrelAllowed, exitVeloAllowed, spinRate, fastballVelo, fWAR
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
  /** Pitching K−BB% */
  kbbPct?: number
  /** Same as kbbPct (optional alias) */
  kBBPct?: number
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
