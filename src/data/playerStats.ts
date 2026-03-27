import type { PlayerStatLine } from '@/types/playerStatLine'
import { RAW_ROSTER } from '@/data/rawRoster'
import { buildStatLine } from '@/data/statLineBuilder'

/**
 * Projected 2025 stat lines keyed by player `name`.
 * Built from `RAW_ROSTER` + `buildStatLine` (deterministic per name/pos/adp).
 *
 * Hitters: pa, avg, obp, slg, hr, rbi, r, sb, cs, bbPct, kPct, babip, hardHitPct,
 * barrelPct, xba, xslg, exitVelo, launchAngle, sprintSpeed, chasePct, contactPct,
 * swstrPct, pullPct, oppoPct, centerPct, fWAR
 *
 * Pitchers: ip, era, whip, k9, bb9, kbbPct, fip, xfip, siera, sv, holds, svh,
 * stuffPlus, locationPlus, cswPct, gbPct, fbPct, hrFbPct, babipAllowed, hardHitAllowed,
 * barrelAllowed, exitVeloAllowed, spinRate, fastballVelo, fWAR
 */
export const PLAYER_STATS: Record<string, PlayerStatLine> = Object.fromEntries(
  RAW_ROSTER.map((r) => [r.name, buildStatLine(r)])
)
