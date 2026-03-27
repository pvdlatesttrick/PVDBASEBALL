/** Career platoon-allowed lines (starter vs LHH / RHH batters). */
export type PlatoonSplitRow = {
  era: number
  obp: number
  slg: number
  kPct: number
  bbPct: number
  hardHitPct: number
  exitVeloAllowed: number
}

export type PitcherPlatoonSplits = {
  vsLHH: PlatoonSplitRow
  vsRHH: PlatoonSplitRow
}

function row(
  era: number,
  obp: number,
  slg: number,
  kPct: number,
  bbPct: number,
  hardHitPct: number,
  ev: number
): PlatoonSplitRow {
  return { era, obp, slg, kPct, bbPct, hardHitPct, exitVeloAllowed: ev }
}

/** Keys must match `awayStarter` / `homeStarter` in `todaysGames`. */
export const PITCHER_SPLITS: Record<string, PitcherPlatoonSplits> = {
  'Gerrit Cole': {
    vsLHH: row(3.05, 0.285, 0.385, 28.2, 5.8, 32.1, 87.2),
    vsRHH: row(3.42, 0.298, 0.412, 31.0, 6.2, 35.4, 88.9),
  },
  'Chris Sale': {
    vsLHH: row(3.88, 0.312, 0.428, 29.5, 7.1, 38.2, 89.5),
    vsRHH: row(3.25, 0.295, 0.398, 32.8, 6.4, 34.0, 87.8),
  },
  'Walker Buehler': {
    vsLHH: row(3.55, 0.302, 0.405, 26.8, 7.2, 36.0, 88.1),
    vsRHH: row(3.18, 0.288, 0.392, 28.5, 6.0, 33.5, 87.0),
  },
  'Justin Steele': {
    vsLHH: row(3.42, 0.298, 0.388, 24.2, 7.5, 34.8, 86.5),
    vsRHH: row(3.65, 0.308, 0.415, 22.8, 8.1, 37.2, 88.0),
  },
  'Framber Valdez': {
    vsLHH: row(3.22, 0.301, 0.398, 25.5, 7.8, 35.9, 87.4),
    vsRHH: row(3.48, 0.312, 0.421, 24.0, 8.2, 38.1, 89.0),
  },
  'Jon Gray': {
    vsLHH: row(4.25, 0.328, 0.455, 22.1, 8.5, 40.2, 90.2),
    vsRHH: row(3.95, 0.318, 0.438, 23.5, 7.9, 38.6, 89.1),
  },
  'Max Fried': {
    vsLHH: row(3.35, 0.292, 0.378, 27.0, 6.5, 33.1, 86.2),
    vsRHH: row(3.08, 0.285, 0.365, 29.2, 5.8, 31.8, 85.5),
  },
  'Zack Wheeler': {
    vsLHH: row(3.12, 0.288, 0.382, 29.8, 5.5, 32.5, 86.8),
    vsRHH: row(3.28, 0.295, 0.398, 30.5, 6.1, 34.2, 87.5),
  },
  'Yu Darvish': {
    vsLHH: row(3.65, 0.305, 0.412, 27.2, 7.0, 35.8, 87.9),
    vsRHH: row(3.42, 0.298, 0.402, 28.8, 6.6, 34.5, 87.2),
  },
  'Logan Webb': {
    vsLHH: row(3.18, 0.288, 0.375, 25.5, 5.2, 32.0, 86.0),
    vsRHH: row(3.05, 0.282, 0.368, 26.8, 5.0, 30.5, 85.2),
  },
  'Shane McClanahan': {
    vsLHH: row(3.48, 0.302, 0.398, 28.5, 7.0, 35.2, 87.5),
    vsRHH: row(2.95, 0.278, 0.358, 31.2, 6.2, 32.8, 86.4),
  },
  'Grayson Rodriguez': {
    vsLHH: row(4.05, 0.322, 0.445, 23.0, 8.8, 39.5, 89.8),
    vsRHH: row(3.78, 0.315, 0.428, 24.5, 8.2, 37.8, 88.6),
  },
  'Freddy Peralta': {
    vsLHH: row(3.55, 0.305, 0.412, 28.0, 8.0, 36.5, 88.0),
    vsRHH: row(3.22, 0.292, 0.395, 30.2, 7.2, 34.2, 87.1),
  },
  'Miles Mikolas': {
    vsLHH: row(3.88, 0.312, 0.418, 20.5, 4.2, 36.8, 87.6),
    vsRHH: row(3.62, 0.305, 0.405, 21.8, 4.8, 35.2, 86.9),
  },
  'Shane Bieber': {
    vsLHH: row(3.42, 0.298, 0.392, 27.5, 6.5, 34.0, 87.0),
    vsRHH: row(3.58, 0.305, 0.408, 26.2, 6.8, 35.5, 87.8),
  },
  'Pablo López': {
    vsLHH: row(3.25, 0.292, 0.382, 28.8, 6.0, 33.5, 86.5),
    vsRHH: row(3.38, 0.298, 0.395, 29.5, 6.4, 34.8, 87.2),
  },
  'George Kirby': {
    vsLHH: row(3.12, 0.285, 0.368, 24.5, 3.8, 31.2, 85.8),
    vsRHH: row(3.28, 0.292, 0.382, 25.8, 4.2, 32.5, 86.4),
  },
  'JP Sears': {
    vsLHH: row(4.12, 0.328, 0.448, 21.5, 8.5, 40.5, 90.0),
    vsRHH: row(3.95, 0.322, 0.432, 22.8, 8.0, 39.0, 89.2),
  },
}

export function getPitcherSplits(name: string): PitcherPlatoonSplits | undefined {
  return PITCHER_SPLITS[name]
}
