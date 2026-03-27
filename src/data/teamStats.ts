/** 2024-style season aggregates — seeded for modeling (not live Statcast). */
export type TeamOffensiveStats = {
  team: string
  wrcPlus: number
  ops: number
  avgExitVelo: number
  hardHitPct: number
  kPct: number
  bbPct: number
  babip: number
  runsPerGame: number
  bullpenEra: number
  bullpenWhip: number
  bullpenKPct: number
  spEra: number
  defensiveDrs: number
  runsPerGameVsL: number
  runsPerGameVsR: number
}

function row(
  team: string,
  wrcPlus: number,
  ops: number,
  avgExitVelo: number,
  hardHitPct: number,
  kPct: number,
  bbPct: number,
  babip: number,
  runsPerGame: number,
  bullpenEra: number,
  bullpenWhip: number,
  bullpenKPct: number,
  spEra: number,
  defensiveDrs: number,
  runsPerGameVsL: number,
  runsPerGameVsR: number
): TeamOffensiveStats {
  return {
    team,
    wrcPlus,
    ops,
    avgExitVelo,
    hardHitPct,
    kPct,
    bbPct,
    babip,
    runsPerGame,
    bullpenEra,
    bullpenWhip,
    bullpenKPct,
    spEra,
    defensiveDrs,
    runsPerGameVsL,
    runsPerGameVsR,
  }
}

/** All 30 clubs — keys match `awayTeam` / `homeTeam` abbreviations in the app. */
export const TEAM_STATS: Record<string, TeamOffensiveStats> = {
  ARI: row('ARI', 98, 0.748, 88.5, 36.2, 22.1, 8.2, 0.298, 4.65, 3.95, 1.28, 23.5, 4.35, 12, 4.7, 4.55),
  ATL: row('ATL', 108, 0.782, 89.2, 38.5, 21.0, 9.1, 0.305, 5.15, 3.55, 1.18, 25.2, 3.95, 18, 5.1, 5.0),
  BAL: row('BAL', 102, 0.755, 88.8, 37.0, 22.5, 8.5, 0.301, 4.85, 3.88, 1.22, 24.0, 4.15, 8, 4.9, 4.75),
  BOS: row('BOS', 104, 0.768, 89.0, 37.8, 22.8, 9.0, 0.302, 5.05, 3.72, 1.20, 24.5, 4.05, 5, 5.2, 4.9),
  CHC: row('CHC', 99, 0.738, 87.9, 36.0, 23.2, 8.8, 0.296, 4.75, 3.68, 1.19, 24.8, 4.10, 15, 4.8, 4.65),
  CHW: row('CHW', 88, 0.698, 87.2, 34.5, 24.5, 7.5, 0.288, 4.15, 4.45, 1.38, 21.5, 4.55, -8, 4.2, 4.1),
  CIN: row('CIN', 101, 0.752, 88.6, 37.2, 24.0, 9.5, 0.299, 4.95, 4.12, 1.28, 23.0, 4.25, -2, 5.0, 4.85),
  CLE: row('CLE', 97, 0.732, 88.0, 35.8, 22.0, 8.9, 0.295, 4.55, 3.58, 1.16, 25.5, 3.88, 22, 4.6, 4.45),
  COL: row('COL', 92, 0.718, 88.4, 36.5, 23.8, 7.9, 0.312, 5.25, 4.85, 1.35, 22.0, 4.90, -15, 5.4, 5.2),
  DET: row('DET', 95, 0.728, 88.1, 36.0, 23.5, 8.6, 0.293, 4.45, 3.95, 1.24, 23.8, 4.20, 10, 4.5, 4.35),
  HOU: row('HOU', 106, 0.775, 89.1, 38.0, 19.5, 9.2, 0.298, 5.10, 3.45, 1.12, 26.0, 3.85, 25, 5.05, 4.95),
  KC: row('KC', 96, 0.725, 87.6, 35.2, 22.8, 7.8, 0.291, 4.55, 4.05, 1.26, 23.2, 4.30, 5, 4.55, 4.4),
  LAA: row('LAA', 99, 0.742, 88.3, 36.8, 23.0, 8.4, 0.297, 4.70, 4.25, 1.30, 22.8, 4.40, -5, 4.85, 4.7),
  LAD: row('LAD', 112, 0.798, 89.8, 39.2, 20.2, 9.8, 0.308, 5.35, 3.35, 1.08, 26.5, 3.65, 35, 5.3, 5.15),
  MIA: row('MIA', 89, 0.702, 87.0, 34.2, 24.8, 7.2, 0.286, 4.05, 4.55, 1.36, 21.8, 4.60, -12, 4.0, 3.95),
  MIL: row('MIL', 100, 0.748, 88.2, 36.5, 22.6, 8.7, 0.294, 4.80, 3.62, 1.17, 25.0, 4.05, 20, 4.85, 4.7),
  MIN: row('MIN', 103, 0.762, 88.9, 37.5, 21.5, 9.0, 0.300, 5.00, 3.78, 1.21, 24.2, 4.15, 12, 5.1, 4.9),
  NYM: row('NYM', 101, 0.752, 88.4, 36.9, 22.2, 9.2, 0.297, 4.90, 3.85, 1.22, 24.0, 4.10, 8, 4.95, 4.8),
  NYY: row('NYY', 105, 0.772, 89.0, 37.9, 21.8, 9.5, 0.301, 5.00, 3.58, 1.15, 25.2, 3.92, 18, 5.05, 4.9),
  OAK: row('OAK', 85, 0.682, 86.8, 33.5, 25.5, 7.0, 0.282, 3.85, 4.75, 1.42, 20.5, 4.75, -22, 3.9, 3.75),
  PHI: row('PHI', 104, 0.768, 89.1, 38.0, 22.0, 9.0, 0.300, 5.10, 3.68, 1.18, 24.8, 4.05, 15, 5.1, 4.95),
  PIT: row('PIT', 93, 0.712, 87.4, 35.0, 23.5, 8.0, 0.290, 4.35, 4.15, 1.28, 22.5, 4.35, -5, 4.4, 4.25),
  SD: row('SD', 98, 0.738, 88.0, 36.2, 23.0, 8.8, 0.294, 4.60, 3.72, 1.19, 24.5, 4.08, 28, 4.65, 4.5),
  SEA: row('SEA', 99, 0.742, 88.2, 36.0, 22.8, 8.5, 0.293, 4.55, 3.95, 1.22, 24.0, 4.12, 20, 4.7, 4.55),
  SF: row('SF', 94, 0.718, 87.5, 35.2, 23.2, 8.2, 0.289, 4.40, 3.88, 1.21, 23.8, 4.15, 22, 4.45, 4.3),
  STL: row('STL', 97, 0.732, 87.8, 35.5, 22.5, 8.6, 0.292, 4.50, 3.82, 1.20, 23.5, 4.18, 10, 4.55, 4.4),
  TB: row('TB', 102, 0.755, 88.6, 36.8, 22.0, 9.0, 0.296, 4.85, 3.65, 1.17, 25.0, 4.00, 8, 4.95, 4.8),
  TEX: row('TEX', 100, 0.748, 88.5, 36.5, 22.5, 8.8, 0.295, 4.80, 3.78, 1.21, 23.8, 4.20, 5, 4.9, 4.75),
  TOR: row('TOR', 101, 0.752, 88.7, 36.9, 21.8, 9.0, 0.297, 4.85, 3.88, 1.22, 24.2, 4.12, 12, 4.9, 4.75),
  WSH: row('WSH', 91, 0.708, 87.2, 34.8, 24.0, 8.0, 0.290, 4.25, 4.35, 1.32, 22.0, 4.45, -8, 4.3, 4.15),
}

export function getTeamStats(teamAbbr: string): TeamOffensiveStats {
  return TEAM_STATS[teamAbbr] ?? TEAM_STATS.OAK
}
