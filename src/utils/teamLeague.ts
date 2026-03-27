/** AL team abbreviations (includes common alternates: KCR, TBR, SDP, SFG, ATH, CHW, etc.) */
export const AL_TEAMS = [
  'NYY',
  'BOS',
  'TOR',
  'TB',
  'TBR',
  'BAL',
  'CLE',
  'MIN',
  'CWS',
  'CHW',
  'KC',
  'KCR',
  'DET',
  'HOU',
  'SEA',
  'TEX',
  'OAK',
  'ATH',
  'LAA',
] as const

const AL_SET = new Set<string>(AL_TEAMS)

/** National League (explicit list for clarity / docs). */
export const NL_TEAMS = [
  'NYM',
  'ATL',
  'PHI',
  'MIA',
  'WSH',
  'WSN',
  'CHC',
  'STL',
  'MIL',
  'CIN',
  'PIT',
  'LAD',
  'SD',
  'SDP',
  'SF',
  'SFG',
  'ARI',
  'COL',
] as const

export function getLeague(team: string): 'AL' | 'NL' {
  return AL_SET.has(team) ? 'AL' : 'NL'
}

/** Teams in PLAYERS / consensus data that appear in a given league. */
export function teamsForLeague(allTeams: string[], league: 'all' | 'AL' | 'NL'): string[] {
  if (league === 'all') return allTeams
  return allTeams.filter((t) => getLeague(t) === league)
}
